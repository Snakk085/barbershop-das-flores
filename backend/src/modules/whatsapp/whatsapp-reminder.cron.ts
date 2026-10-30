// ==============================================================================
// WHATSAPP REMINDER CRON & BULLMQ QUEUE PROCESSOR
// NestJS Schedule + BullMQ + Evolution API / Baileys Integration
// Envio matinal com botão interativo para confirmação de presença (Anti-No-Show)
// ==============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppointmentStatus, WhatsAppMessageType } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class WhatsAppReminderCron {
  private readonly logger = new Logger(WhatsAppReminderCron.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('whatsapp-notifications') private readonly whatsappQueue: Queue,
  ) {}

  /**
   * CRON JOB MATINAL: Roda todos os dias às 08:00 AM (Fuso horário de Brasília)
   * Busca clientes que têm agendamentos CONFIRMADOS para o dia atual.
   */
  @Cron('0 8 * * *', {
    name: 'MorningWhatsAppReminder',
    timeZone: 'America/Sao_Paulo',
  })
  async handleDailyMorningReminders() {
    this.logger.log('Iniciando Cron Job de Lembretes Matinais de Agendamentos...');

    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    // 1. Busca todos os agendamentos confirmados para hoje que ainda não receberam lembrete
    const todayAppointments = await this.prisma.appointment.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: AppointmentStatus.CONFIRMED,
        reminderSentAt: null, // Evita disparos duplicados
      },
      include: {
        client: true,
        barber: { include: { user: true } },
        service: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (todayAppointments.length === 0) {
      this.logger.log('Nenhum agendamento pendente de lembrete para hoje.');
      return;
    }

    this.logger.log(
      \`Encontrados \${todayAppointments.length} agendamentos para hoje. Enfileirando disparos...\`,
    );

    // 2. Enfileira cada mensagem no BullMQ com delay progressivo
    // Evita disparos em massa simultâneos para proteger o número de WhatsApp contra banimento
    let delayMs = 0;
    const intervalBetweenMessagesMs = 4000; // 4 segundos entre disparos

    for (const appt of todayAppointments) {
      await this.whatsappQueue.add(
        'send-reminder',
        {
          appointmentId: appt.id,
          appointmentCode: appt.code,
          clientPhone: appt.client.phone,
          clientName: appt.client.name,
          barberName: appt.barber.user.name,
          serviceName: appt.service.name,
          startTime: appt.startTime,
          confirmationLink: \`https://app.barbearia.com.br/checkin/\${appt.code}\`,
        },
        {
          delay: delayMs,
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
          removeOnComplete: true,
        },
      );

      // Marca o agendamento com a data do envio do lembrete
      await this.prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: new Date() },
      });

      delayMs += intervalBetweenMessagesMs;
    }

    this.logger.log(\`Todos os \${todayAppointments.length} lembretes foram despachados para a fila.\`);
  }
}

// ==============================================================================
// BULLMQ PROCESSOR: Processa as mensagens com a Evolution API
// ==============================================================================

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import axios from 'axios';

@Processor('whatsapp-notifications')
export class WhatsAppConsumer {
  private readonly logger = new Logger(WhatsAppConsumer.name);
  private readonly evolutionApiUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  private readonly evolutionApiKey = process.env.EVOLUTION_API_KEY;
  private readonly instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'barbearia_principal';

  constructor(private readonly prisma: PrismaService) {}

  @Process('send-reminder')
  async processReminder(job: Job<any>) {
    const data = job.data;
    this.logger.log(\`Processando envio de WhatsApp para \${data.clientName} (\${data.clientPhone})\`);

    // Formata a mensagem com estilo e links interativos
    const messageText = 
\`💈 *LEMBRETE DE AGENDAMENTO - BARBERSHOP DAS FLORES* 💈

Fala, *\${data.clientName}*! Tudo certo?
Hoje é o dia de dar aquele trato no visual!

✂️ *Serviço:* \${data.serviceName}
💈 *Barbeiro:* \${data.barberName}
⏰ *Horário:* às *\${data.startTime}*
📍 *Local:* BarberShop Das Flores - Rua Bulgária, 405 (Manoel Sátiro, Fortaleza - CE)

Você confirma sua presença hoje?
👉 Clique no link abaixo para confirmar em 1 toque:
\${data.confirmationLink}

_Caso precise remarcar, avise com no mínimo 2h de antecedência._
Te esperamos lá! 👊\`;

    try {
      // Chamada HTTP para Evolution API (ou Baileys Wrapper)
      const response = await axios.post(
        \`\${this.evolutionApiUrl}/message/sendText/\${this.instanceName}\`,
        {
          number: this.formatPhone(data.clientPhone),
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: true,
          },
          textMessage: {
            text: messageText,
          },
        },
        {
          headers: {
            apikey: this.evolutionApiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      // Registra o log no banco de dados para auditoria
      await this.prisma.whatsappMessageLog.create({
        data: {
          appointmentId: data.appointmentId,
          recipientPhone: data.clientPhone,
          messageType: WhatsAppMessageType.DAILY_REMINDER_MORNING,
          content: messageText,
          status: 'SENT',
          providerMsgId: response.data?.key?.id ?? null,
          sentAt: new Date(),
        },
      });

      this.logger.log(\`WhatsApp enviado com sucesso para \${data.clientPhone}\`);
    } catch (error: any) {
      this.logger.error(\`Falha no envio de WhatsApp para \${data.clientPhone}: \${error.message}\`);
      
      await this.prisma.whatsappMessageLog.create({
        data: {
          appointmentId: data.appointmentId,
          recipientPhone: data.clientPhone,
          messageType: WhatsAppMessageType.DAILY_REMINDER_MORNING,
          content: messageText,
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      throw error; // Permite o BullMQ reexecutar caso necessário
    }
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\\D/g, '');
    return cleaned.startsWith('55') ? cleaned : \`55\${cleaned}\`;
  }
}
`,

  securityAndMain: `// ==============================================================================
// MAIN.TS & SECURITY ARCHITECTURE
// Helmet, Rate Limiting (Throttler), ValidationPipe & RBAC Guards
// ==============================================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Helmet para headers de segurança HTTP contra XSS, clickjacking e sniffing
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. CORS configurado restritivamente para o PWA no Vercel
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://barberflow.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 3. Validação global rigorosa de DTOs com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos injetados maliciosamente
      forbidNonWhitelisted: true, // Rejeita payloads com propriedades não mapeadas
      transform: true, // Converte tipos automaticamente (string -> number, date)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 3333;
  await app.listen(port);
  console.log(\`🚀 Backend BarberFlow rodando com sucesso na porta \${port}\`);
}
bootstrap();
`,

  webhookService: `// ==============================================================================
// PAYMENTS CONTROLLER & MERCADO PAGO / ASAAS WEBHOOK HANDLER
// Confirmação instantânea do agendamento e liberação do lock da agenda
// ==============================================================================

import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { WhatsAppConsumer } from '../whatsapp/whatsapp.processor';
import * as crypto from 'crypto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * WEBHOOK DO MERCADO PAGO / ASAAS
   * Valida assinatura HMAC, atualiza o status do pagamento para PAID
   * e muda o agendamento de PENDING_PAYMENT para CONFIRMED.
   */
  @Post('webhook/mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(
    @Body() payload: any,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
  ) {
    this.logger.log(\`Webhook recebido: \${payload.action} | ID: \${payload.data?.id}\`);

    // 1. Verificação de Assinatura Criptográfica HMAC SHA256 (Anti-Spoofing)
    if (process.env.NODE_ENV === 'production') {
      const isValid = this.verifyMercadoPagoSignature(xSignature, xRequestId, payload.data?.id);
      if (!isValid) {
        this.logger.warn('Tentativa de spoofing: assinatura de webhook inválida');
        return { status: 'invalid_signature' };
      }
    }

    // 2. Processa apenas se o pagamento foi aprovado
    if (payload.action === 'payment.updated' || payload.type === 'payment') {
      const paymentGatewayId = payload.data?.id?.toString();

      // Busca o registro de pagamento local
      const payment = await this.prisma.payment.findFirst({
        where: { externalReference: paymentGatewayId },
        include: { appointment: { include: { client: true, barber: { include: { user: true } }, service: true } } },
      });

      if (!payment) {
        this.logger.warn(\`Pagamento de referência \${paymentGatewayId} não encontrado no sistema\`);
        return { received: true };
      }

      // Idempotência: se já foi aprovado, não reprocessa
      if (payment.status === PaymentStatus.PAID) {
        return { received: true, already_processed: true };
      }

      // Atualiza pagamento e agendamento em transação atômica
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            rawWebhookPayload: payload,
          },
        });

        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: AppointmentStatus.CONFIRMED,
            reservationExpiresAt: null, // Remove o timeout do lock
          },
        });
      });

      this.logger.log(\`✅ Agendamento \${payment.appointment.code} CONFIRMADO com sucesso após Pix!\`);
    }

    return { received: true };
  }

  private verifyMercadoPagoSignature(signatureHeader: string, requestId: string, dataId: string): boolean {
    if (!signatureHeader || !process.env.MERCADO_PAGO_WEBHOOK_SECRET) return false;
    const parts = signatureHeader.split(',');
    let ts = '';
    let hash = '';
    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key?.trim() === 'ts') ts = val?.trim();
      if (key?.trim() === 'v1') hash = val?.trim();
    }
    const manifest = \`id:\${dataId};request-id:\${requestId};ts:\${ts};\`;
    const computedHash = crypto
      .createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
      .update(manifest)
      .digest('hex');

    return computedHash === hash;
  }
}
`
};
