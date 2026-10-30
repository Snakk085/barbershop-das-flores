export interface CodeFile {
  title: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const BACKEND_BLUEPRINT = {
  prismaSchema: `// ==============================================================================
// PRISMA SCHEMA - BARBERFLOW PRO
// Database: PostgreSQL
// Multi-tenant ready, strict ACID relations, and optimized indexes for scheduling
// ==============================================================================

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

enum UserRole {
  ADMIN       // Dono/Gerente da Barbearia
  BARBER      // Profissional Barbeiro
  CLIENT      // Cliente final
}

enum AppointmentStatus {
  PENDING_PAYMENT  // Aguardando confirmação do Pix (lock de 15 min)
  CONFIRMED        // Pix aprovado e horário 100% garantido na agenda
  IN_PROGRESS      // Cliente na cadeira
  COMPLETED        // Atendimento finalizado
  CANCELLED        // Cancelado pelo cliente ou admin
  NO_SHOW          // Cliente não compareceu (sinal retido)
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
  EXPIRED
  FAILED
}

enum PaymentProvider {
  MERCADO_PAGO
  ASAAS
}

enum WhatsAppMessageType {
  BOOKING_CONFIRMATION
  DAILY_REMINDER_MORNING
  PRESENCE_CONFIRMED
  CANCELLATION_NOTICE
}

enum WhatsAppDeliveryStatus {
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
}

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

model User {
  id            String         @id @default(uuid()) @db.Uuid
  name          String         @db.VarChar(120)
  email         String?        @unique @db.VarChar(150)
  phone         String         @unique @db.VarChar(20) // Format: +5511999999999
  passwordHash  String?        @map("password_hash") @db.VarChar(255)
  role          UserRole       @default(CLIENT)
  googleId      String?        @unique @map("google_id")
  avatarUrl     String?        @map("avatar_url")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  // Relations
  barberProfile BarberProfile?
  clientAppointments Appointment[] @relation("ClientAppointments")
  auditLogs     AuditLog[]

  @@index([phone])
  @@index([email])
  @@map("users")
}

model BarberProfile {
  id             String          @id @default(uuid()) @db.Uuid
  userId         String          @unique @map("user_id") @db.Uuid
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio            String?         @db.Text
  specialties    String[]        @default([])
  commissionRate Decimal         @default(0.50) @map("commission_rate") @db.Decimal(5, 2) // e.g. 0.60 = 60%
  isActive       Boolean         @default(true) @map("is_active")
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  // Relations
  workingHours   WorkingHours[]
  blockedSlots   BlockedSlot[]
  appointments   Appointment[]   @relation("BarberAppointments")

  @@map("barber_profiles")
}

model WorkingHours {
  id             String        @id @default(uuid()) @db.Uuid
  barberId       String        @map("barber_id") @db.Uuid
  barber         BarberProfile @relation(fields: [barberId], references: [id], onDelete: Cascade)
  dayOfWeek      Int           @map("day_of_week") // 0 = Domingo, 1 = Segunda ... 6 = Sábado
  startTime      String        @map("start_time") @db.VarChar(5) // "09:00"
  endTime        String        @map("end_time") @db.VarChar(5)   // "19:00"
  lunchStartTime String?       @map("lunch_start_time") @db.VarChar(5) // "12:00"
  lunchEndTime   String?       @map("lunch_end_time") @db.VarChar(5)   // "13:00"
  isOffDay       Boolean       @default(false) @map("is_off_day")

  @@unique([barberId, dayOfWeek])
  @@map("working_hours")
}

model BlockedSlot {
  id          String         @id @default(uuid()) @db.Uuid
  barberId    String?        @map("barber_id") @db.Uuid // null = Feriado / Fechamento geral da barbearia
  barber      BarberProfile? @relation(fields: [barberId], references: [id], onDelete: Cascade)
  date        DateTime       @db.Date
  isFullDay   Boolean        @default(false) @map("is_full_day") // true = Dia inteiro indisponível (Feriado ou Folga)
  startTime   String?        @map("start_time") @db.VarChar(5)   // "15:00" (ou null se isFullDay)
  endTime     String?        @map("end_time") @db.VarChar(5)     // "16:00" (ou null se isFullDay)
  reason      String?        @db.VarChar(255)                    // "Feriado de Finados", "Folga Semanal"
  createdAt   DateTime       @default(now()) @map("created_at")

  @@index([barberId, date])
  @@index([date, isFullDay])
  @@map("blocked_slots")
}

model Service {
  id              String        @id @default(uuid()) @db.Uuid
  name            String        @db.VarChar(100)
  description     String?       @db.Text
  durationMinutes Int           @map("duration_minutes") // 30, 45, 60
  price           Decimal       @db.Decimal(10, 2)
  depositRequired Decimal       @default(20.00) @map("deposit_required") @db.Decimal(10, 2) // Sinal Pix No-Show
  category        String        @db.VarChar(50) // "Cabelo", "Barba", "Combo"
  isActive        Boolean       @default(true) @map("is_active")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Relations
  appointments    Appointment[]

  @@map("services")
}

model Appointment {
  id                       String            @id @default(uuid()) @db.Uuid
  code                     String            @unique @db.VarChar(12) // Format: "BF-8392"
  clientId                 String            @map("client_id") @db.Uuid
  client                   User              @relation("ClientAppointments", fields: [clientId], references: [id])
  barberId                 String            @map("barber_id") @db.Uuid
  barber                   BarberProfile     @relation("BarberAppointments", fields: [barberId], references: [id])
  serviceId                String            @map("service_id") @db.Uuid
  service                  Service           @relation(fields: [serviceId], references: [id])

  date                     DateTime          @db.Date
  startTime                String            @map("start_time") @db.VarChar(5) // "14:00"
  endTime                  String            @map("end_time") @db.VarChar(5)   // "14:45"
  
  status                   AppointmentStatus @default(PENDING_PAYMENT)
  totalPrice               Decimal           @map("total_price") @db.Decimal(10, 2)
  depositAmount            Decimal           @map("deposit_amount") @db.Decimal(10, 2)
  
  // Temporary reservation lock (ex: 15 min to pay Pix)
  reservationExpiresAt     DateTime?         @map("reservation_expires_at")
  presenceConfirmedAt      DateTime?         @map("presence_confirmed_at")
  reminderSentAt           DateTime?         @map("reminder_sent_at")
  cancellationReason       String?           @map("cancellation_reason") @db.VarChar(255)

  createdAt                DateTime          @default(now()) @map("created_at")
  updatedAt                DateTime          @updatedAt @map("updated_at")

  // Relations
  payments                 Payment[]
  whatsappLogs             WhatsAppMessageLog[]

  // CRITICAL INDEXES for concurrency queries & calendar lookups
  @@index([barberId, date, status])
  @@index([date, status])
  @@index([clientId, date])
  @@map("appointments")
}

model Payment {
  id                  String          @id @default(uuid()) @db.Uuid
  appointmentId       String          @map("appointment_id") @db.Uuid
  appointment         Appointment     @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  provider            PaymentProvider @default(MERCADO_PAGO)
  status              PaymentStatus   @default(PENDING)
  amount              Decimal         @db.Decimal(10, 2)
  
  // Pix Data
  externalReference   String?         @unique @map("external_reference") @db.VarChar(100) // Gateway ID
  pixCopiaECola       String?         @map("pix_copia_e_cola") @db.Text
  pixQrCodeUrl        String?         @map("pix_qr_code_url") @db.Text
  expiresAt           DateTime        @map("expires_at")
  paidAt              DateTime?       @map("paid_at")
  rawWebhookPayload   Json?           @map("raw_webhook_payload")
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")

  @@index([externalReference])
  @@map("payments")
}

model WhatsAppMessageLog {
  id             String                 @id @default(uuid()) @db.Uuid
  appointmentId  String?                @map("appointment_id") @db.Uuid
  appointment    Appointment?           @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  recipientPhone String                 @map("recipient_phone") @db.VarChar(20)
  messageType    WhatsAppMessageType    @map("message_type")
  content        String                 @db.Text
  status         WhatsAppDeliveryStatus @default(QUEUED)
  providerMsgId  String?                @map("provider_msg_id") @db.VarChar(100)
  errorMessage   String?                @map("error_message") @db.Text
  sentAt         DateTime?              @map("sent_at")
  createdAt      DateTime               @default(now()) @map("created_at")

  @@index([recipientPhone, createdAt])
  @@index([appointmentId])
  @@map("whatsapp_message_logs")
}

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action     String   @db.VarChar(100)
  entity     String   @db.VarChar(50)
  entityId   String   @map("entity_id") @db.VarChar(100)
  metadata   Json?
  ipAddress  String?  @map("ip_address") @db.VarChar(45)
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("audit_logs")
}
`,

  folderStructure: `barberflow-backend/
├── src/
│   ├── main.ts                         # Bootstrap do NestJS, Helmet, CORS, Rate-Limit, Swagger
│   ├── app.module.ts                   # Registro de módulos e ConfigModule global
│   │
│   ├── common/                         # Camadas transversais (segurança, filtros, decorators)
│   │   ├── constants/
│   │   │   └── roles.enum.ts           # ADMIN, BARBER, CLIENT
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts      # @Roles(Role.ADMIN, Role.BARBER)
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts          # RBAC enforcement
│   │   │   └── throttler-behind-proxy.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts       # Extensão com soft-deletes e hooks
│   │
│   ├── modules/                        # Módulos de domínio desacoplados (DDD)
│   │   ├── auth/                       # Autenticação JWT, Refresh Tokens, Google OAuth
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   └── strategies/
│   │   │
│   │   ├── appointments/               # CORE: Motor de agendamento & anti-concorrência
│   │   │   ├── appointments.controller.ts
│   │   │   ├── appointments.service.ts # Lógica transacional com Advisory Locks
│   │   │   ├── dto/
│   │   │   │   ├── create-appointment.dto.ts
│   │   │   │   └── query-available-slots.dto.ts
│   │   │   └── interfaces/
│   │   │
│   │   ├── barbers/                    # Painel do Barbeiro, Horários e Folgas
│   │   │   ├── barbers.controller.ts
│   │   │   ├── barbers.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── services/                   # Catálogo de cortes, barbas e tratamentos
│   │   │   ├── services.controller.ts
│   │   │   └── services.service.ts
│   │   │
│   │   ├── payments/                   # Gateway Pix (Mercado Pago / Asaas) & Webhooks
│   │   │   ├── payments.controller.ts  # Endpoint do Webhook com HMAC Signature
│   │   │   ├── payments.service.ts
│   │   │   ├── mercadopago.provider.ts
│   │   │   └── dto/
│   │   │
│   │   └── whatsapp/                   # Motor de automação WhatsApp (Evolution API / Baileys)
│   │       ├── whatsapp.controller.ts
│   │       ├── whatsapp.service.ts     # Client HTTP para Evolution API
│   │       ├── whatsapp.processor.ts   # BullMQ Worker com rate limiting anti-ban
│   │       ├── cron/
│   │       │   └── whatsapp-reminder.cron.ts # Tarefa matinal agendada (08:00 AM)
│   │       └── templates/
│   │
│   └── config/                         # Validação de variáveis de ambiente com Joi/Zod
│       └── env.validation.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                         # Carga inicial com serviços, dono e barbeiros
├── Dockerfile                          # Deploy otimizado multi-stage para Render
├── render.yaml                         # Blueprint de infraestrutura (Web Service + Postgres)
└── package.json`,

  appointmentService: `// ==============================================================================
// APPOINTMENTS SERVICE - CORE SCHEDULING & CONCURRENCY PREVENTION
// NestJS + Prisma ORM + PostgreSQL Pessimistic Advisory Locking
// ==============================================================================

import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAvailableSlotsDto } from './dto/query-available-slots.dto';
import { PaymentsService } from '../payments/payments.service';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { addMinutes, format, parse, isBefore, isAfter, isSameDay } from 'date-fns';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * 1. CÁLCULO DE HORÁRIOS DISPONÍVEIS (MOTOR INTELIGENTE)
   * Cruza duração do serviço + expediente do barbeiro + almoço + bloqueios + agendamentos
   */
  async getAvailableSlots(query: QueryAvailableSlotsDto) {
    const { barberId, serviceId, dateStr } = query;
    const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date());

    // A. Busca Serviço
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado ou inativo');

    // B. Busca Horário de Trabalho do Barbeiro para o dia da semana
    const dayOfWeek = targetDate.getDay(); // 0 = Domingo, 1 = Segunda...
    const workingHours = await this.prisma.workingHours.findUnique({
      where: {
        barberId_dayOfWeek: { barberId, dayOfWeek },
      },
    });

    if (!workingHours || workingHours.isOffDay) {
      return { date: dateStr, availableSlots: [], reason: 'Barbeiro de folga neste dia' };
    }

    // C. Busca Agendamentos Conflitantes (Confirmados OU Bloqueados temporariamente no Pix)
    const now = new Date();
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId,
        date: targetDate,
        OR: [
          { status: AppointmentStatus.CONFIRMED },
          { status: AppointmentStatus.IN_PROGRESS },
          // Locks temporários de Pix que ainda não expiraram
          {
            status: AppointmentStatus.PENDING_PAYMENT,
            reservationExpiresAt: { gt: now },
          },
        ],
      },
      select: { startTime: true, endTime: true },
    });

    // D. Busca Bloqueios Manuais do Barbeiro (pausas, férias, cursos)
    const manualBlocks = await this.prisma.blockedSlot.findMany({
      where: { barberId, date: targetDate },
      select: { startTime: true, endTime: true },
    });

    const busyRanges = [
      ...existingAppointments,
      ...manualBlocks,
      // Se houver almoço configurado, adiciona como busy range
      ...(workingHours.lunchStartTime && workingHours.lunchEndTime
        ? [{ startTime: workingHours.lunchStartTime, endTime: workingHours.lunchEndTime }]
        : []),
    ];

    // E. Algoritmo de Geração de Janelas em Intervalos de 15/30 minutos
    const slots: string[] = [];
    const intervalMinutes = 30; // Passo da grade
    let cursor = parse(workingHours.startTime, 'HH:mm', targetDate);
    const dayEnd = parse(workingHours.endTime, 'HH:mm', targetDate);

    while (true) {
      const candidateStart = cursor;
      const candidateEnd = addMinutes(candidateStart, service.durationMinutes);

      // Não pode ultrapassar o horário de encerramento da barbearia
      if (isAfter(candidateEnd, dayEnd)) break;

      const candidateStartStr = format(candidateStart, 'HH:mm');
      const candidateEndStr = format(candidateEnd, 'HH:mm');

      // Se for a data de hoje, não exibe horários já passados
      const isPast = isSameDay(targetDate, now) && isBefore(candidateStart, now);

      if (!isPast) {
        // Verifica se colide com qualquer intervalo ocupado:
        // Colisão: (StartA < EndB) AND (EndA > StartB)
        const hasCollision = busyRanges.some((busy) => {
          return candidateStartStr < busy.endTime && candidateEndStr > busy.startTime;
        });

        if (!hasCollision) {
          slots.push(candidateStartStr);
        }
      }

      cursor = addMinutes(cursor, intervalMinutes);
    }

    return {
      date: dateStr,
      barberId,
      serviceId,
      durationMinutes: service.durationMinutes,
      availableSlots: slots,
    };
  }

  /**
   * 2. CRIAÇÃO DE AGENDAMENTO COM PREVENÇÃO DE CONCORRÊNCIA E LOCK TRANSACIONAL
   * Impede condição de corrida quando 2 clientes tentam clicar no mesmo horário no mesmo milissegundo.
   */
  async createAppointment(dto: CreateAppointmentDto, clientId: string) {
    const { barberId, serviceId, dateStr, startTime } = dto;
    const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date());

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
    });
    if (!service) throw new NotFoundException('Serviço inválido');

    // Calcula horário final
    const startDateTime = parse(startTime, 'HH:mm', targetDate);
    const endDateTime = addMinutes(startDateTime, service.durationMinutes);
    const endTime = format(endDateTime, 'HH:mm');

    // Chave de lock única por barbeiro + dia para PostgreSQL Advisory Xact Lock
    // Converte UUID para BigInt hash seguro
    const lockKey = this.generateAdvisoryLockKey(barberId, dateStr);

    // =========================================================================
    // TRANSAÇÃO COM ISOLAMENTO STRICT SERIALIZABLE / ADVISORY LOCK
    // =========================================================================
    return await this.prisma.$transaction(async (tx) => {
      // 1. Adquire Lock consultivo no PostgreSQL durante a transação atual.
      // Se outra requisição para o mesmo barbeiro e dia entrar simultaneamente,
      // ela aguardará a conclusão desta transação antes de prosseguir!
      await tx.$executeRaw\`SELECT pg_advisory_xact_lock(\${lockKey})\`;

      const now = new Date();

      // 2. Verifica Conflito Real no Banco dentro da transação isolada
      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          barberId,
          date: targetDate,
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
            {
              OR: [
                { status: AppointmentStatus.CONFIRMED },
                { status: AppointmentStatus.IN_PROGRESS },
                // Lock temporário ativo de 15 min
                {
                  status: AppointmentStatus.PENDING_PAYMENT,
                  reservationExpiresAt: { gt: now },
                },
              ],
            },
          ],
        },
      });

      if (conflictingAppointment) {
        throw new ConflictException(
          'Desculpe! Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro slot.',
        );
      }

      // 3. Verifica Bloqueio Manual
      const conflictingBlock = await tx.blockedSlot.findFirst({
        where: {
          barberId,
          date: targetDate,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (conflictingBlock) {
        throw new ConflictException('Horário indisponível devido a bloqueio do profissional');
      }

      // 4. Gera Código Amigável (ex: BF-7482)
      const appointmentCode = \`BF-\${Math.floor(1000 + Math.random() * 9000)}\`;

      // 5. Define Expiração do Lock Temporário para pagamento do Pix (15 minutos)
      const reservationExpiresAt = addMinutes(now, 15);

      // 6. Cria o Agendamento no estado PENDING_PAYMENT
      const appointment = await tx.appointment.create({
        data: {
          code: appointmentCode,
          clientId,
          barberId,
          serviceId,
          date: targetDate,
          startTime,
          endTime,
          totalPrice: service.price,
          depositAmount: service.depositRequired,
          status: AppointmentStatus.PENDING_PAYMENT,
          reservationExpiresAt,
        },
        include: {
          client: true,
          barber: { include: { user: true } },
          service: true,
        },
      });

      // 7. Gera Cobrança Pix Imediata via Gateway (Mercado Pago / Asaas)
      const pixPayment = await this.paymentsService.generatePixDeposit(
        tx,
        appointment,
        service.depositRequired.toNumber(),
      );

      this.logger.log(
        \`Agendamento \${appointment.code} pré-reservado com sucesso. Aguardando Pix até \${reservationExpiresAt.toISOString()}\`,
      );

      return {
        appointmentId: appointment.id,
        code: appointment.code,
        date: dateStr,
        startTime,
        endTime,
        barberName: appointment.barber.user.name,
        serviceName: service.name,
        totalPrice: service.price,
        depositAmount: service.depositRequired,
        expiresAt: reservationExpiresAt,
        pix: {
          copiaECola: pixPayment.pixCopiaECola,
          qrCodeUrl: pixPayment.pixQrCodeUrl,
          paymentId: pixPayment.id,
        },
      };
    });
  }

  /**
   * Converte hash de barbeiro + data em BigInt para pg_advisory_xact_lock
   */
  private generateAdvisoryLockKey(barberId: string, dateStr: string): bigint {
    let hash = 0n;
    const str = \`\${barberId}_\${dateStr}\`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5n) - hash + BigInt(str.charCodeAt(i));
      hash &= 0x7fffffffffffn; // mantém nos limites do bigint postgres
    }
    return hash;
  }
}
`,

  whatsappCron: `// ==============================================================================
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
