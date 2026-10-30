import React, { useState } from 'react';
import { Header } from './components/Header';
import { ClientPWAView } from './components/ClientPWAView';
import { BarberDashboard } from './components/BarberDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { BackendBlueprintView } from './components/BackendBlueprintView';
import { HandoverKitModal } from './components/HandoverKitModal';
import {
  INITIAL_BARBERS,
  INITIAL_SERVICES,
  INITIAL_APPOINTMENTS,
  INITIAL_WHATSAPP_LOGS,
  INITIAL_METRICS,
  INITIAL_BLOCKED_DATES,
} from './data/mockData';
import {
  Barber,
  ServiceItem,
  Appointment,
  WhatsAppNotification,
  BarberShopMetrics,
  UserRole,
  AppointmentStatus,
  BlockedDate,
  ManualTimeBlock,
} from './types/barbershop';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole | 'BLUEPRINT'>('CLIENT');
  const [barbers, setBarbers] = useState<Barber[]>(INITIAL_BARBERS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppNotification[]>(INITIAL_WHATSAPP_LOGS);
  const [metrics, setMetrics] = useState<BarberShopMetrics>(INITIAL_METRICS);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(INITIAL_BLOCKED_DATES);
  const [manualBlocks, setManualBlocks] = useState<ManualTimeBlock[]>([]);
  const [isHandoverOpen, setIsHandoverOpen] = useState<boolean>(false);

  // Toast / System notice
  const [systemToast, setSystemToast] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setSystemToast({ message, type });
    setTimeout(() => setSystemToast(null), 3500);
  };

  // 1. Create appointment (status: PENDING_PAYMENT)
  const handleCreateAppointment = (newAppt: Appointment) => {
    setAppointments((prev) => [newAppt, ...prev]);
    showToast(`Horário ${newAppt.startTime} pré-reservado! Conclua o Pix em 15 minutos para garantir sua cadeira na BarberShop Das Flores.`, 'info');
  };

  // 2. Confirm Pix payment (Webhook trigger) -> State transition to CONFIRMED
  const handleConfirmPixPayment = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appointmentId) {
          return {
            ...a,
            status: 'CONFIRMED' as AppointmentStatus,
            paymentStatus: 'PAID',
            confirmedAt: new Date().toISOString(),
          };
        }
        return a;
      })
    );

    const targetAppt = appointments.find((a) => a.id === appointmentId);
    if (targetAppt) {
      // Add WhatsApp log for Booking Confirmation
      const newLog: WhatsAppNotification = {
        id: `wpp-${Date.now()}`,
        appointmentId,
        phone: targetAppt.clientPhone,
        clientName: targetAppt.clientName,
        type: 'BOOKING_CONFIRMATION',
        message: `Fala, ${targetAppt.clientName.split(' ')[0]}! Agendamento ${targetAppt.code} CONFIRMADO para o dia ${targetAppt.date} às ${targetAppt.startTime} na BarberShop Das Flores (Rua Bulgária, 405 - Manoel Sátiro, Fortaleza).`,
        sentAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'DELIVERED',
      };
      setWhatsappLogs((prev) => [newLog, ...prev]);

      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        confirmedCount: prev.confirmedCount + 1,
        totalRevenueMonth: prev.totalRevenueMonth + targetAppt.servicePrice,
        pixDepositTotal: prev.pixDepositTotal + targetAppt.depositAmount,
        totalAppointments: prev.totalAppointments + 1,
      }));
    }

    showToast('✅ Webhook processado! Pagamento Pix computado e horário confirmado na agenda.');
  };

  // 3. Confirm Presence by client
  const handleConfirmPresence = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, presenceConfirmedByClient: true } : a))
    );
    showToast('Presença confirmada! O barbeiro foi notificado em tempo real.');
  };

  // 4. Update appointment status (Barber action: IN_PROGRESS, COMPLETED)
  const handleUpdateAppointmentStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
    );
    showToast(`Status atualizado para ${newStatus}.`);
  };

  // 5. Update barber schedule
  const handleUpdateBarberSchedule = (
    barberId: string,
    updates: { start: string; end: string; lunchStart: string; lunchEnd: string; daysOfWeek: number[] }
  ) => {
    setBarbers((prev) =>
      prev.map((b) => (b.id === barberId ? { ...b, workingHours: updates } : b))
    );
    showToast('Horário de expediente e intervalos atualizados com sucesso!');
  };

  // 6. Update commission on the fly
  const handleUpdateCommissionRate = (barberId: string, rate: number) => {
    setBarbers((prev) =>
      prev.map((b) => (b.id === barberId ? { ...b, commissionRate: rate } : b))
    );
    showToast(
      rate === 1.0
        ? '✨ Modo "Sem Comissão" ativado! O barbeiro recebe 100% dos cortes sem desconto.'
        : `Comissão atualizada na hora para ${(rate * 100).toFixed(0)}%!`,
    );
  };

  // 7. Add short manual block
  const handleAddManualBlock = (
    barberId: string,
    block: { startTime: string; endTime: string; date: string; reason: string }
  ) => {
    setManualBlocks((prev) => [...prev, { barberId, ...block }]);
    showToast(`Pausa de ${block.startTime} às ${block.endTime} inserida na agenda.`);
  };

  // 8. Add whole-day block (Holiday or Barber Day Off)
  const handleAddBlockedDate = (newBlocked: BlockedDate) => {
    setBlockedDates((prev) => [newBlocked, ...prev]);
    showToast(
      newBlocked.isGlobalHoliday
        ? `🇧🇷 Feriado registrado (${newBlocked.date}): Barbearia fechada!`
        : `🏖️ Folga registrada para ${newBlocked.date}. Horários bloqueados para clientes!`,
      'info'
    );
  };

  // 9. Remove whole-day block
  const handleRemoveBlockedDate = (blockedDateId: string) => {
    setBlockedDates((prev) => prev.filter((b) => b.id !== blockedDateId));
    showToast('Data desbloqueada e reaberta para agendamento!');
  };

  // 10. Add service / promotion
  const handleAddService = (newService: ServiceItem) => {
    setServices((prev) => [newService, ...prev]);
    showToast(`Serviço "${newService.name}" cadastrado com sucesso!`);
  };

  // 11. Add promotion from Barber
  const handleAddPromotion = (newPromo: ServiceItem) => {
    setServices((prev) => [newPromo, ...prev]);
    showToast(`🔥 Promoção "${newPromo.name}" publicada com sucesso no PWA!`);
  };

  // 12. Delete service
  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    showToast('Serviço removido do catálogo.');
  };

  // 13. Add new barber to the team
  const handleAddBarber = (newBarber: Barber) => {
    setBarbers((prev) => [...prev, newBarber]);
    showToast(`Barbeiro ${newBarber.name} adicionado à equipe da BarberShop Das Flores!`);
  };

  // 14. Run morning WhatsApp cron
  const handleRunMorningCron = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayConfirmed = appointments.filter(
      (a) => a.date === today && a.status === 'CONFIRMED'
    );

    if (todayConfirmed.length === 0) {
      showToast('Nenhum agendamento confirmado para a data de hoje.', 'info');
      return;
    }

    const newLogs: WhatsAppNotification[] = todayConfirmed.map((appt, i) => ({
      id: `wpp-cron-${Date.now()}-${i}`,
      appointmentId: appt.id,
      phone: appt.clientPhone,
      clientName: appt.clientName,
      type: 'DAILY_REMINDER',
      message: `💈 Olá ${appt.clientName}! Lembrete do seu agendamento hoje às ${appt.startTime} com ${appt.barberName} na BarberShop Das Flores (Rua Bulgária, 405 - Manoel Sátiro, Fortaleza). Confirme sua presença!`,
      sentAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT',
    }));

    setWhatsappLogs((prev) => [...newLogs, ...prev]);
    setAppointments((prev) =>
      prev.map((a) => (a.date === today && a.status === 'CONFIRMED' ? { ...a, reminderSent: true } : a))
    );

    showToast(`🚀 Cron Matinal executado! ${todayConfirmed.length} lembretes despachados para a fila BullMQ.`);
  };

  // 15. Simulate incoming Webhook
  const handleSimulateWebhook = (payload: any) => {
    const target = appointments.find((a) => a.status === 'PENDING_PAYMENT') || appointments[0];
    if (target) {
      handleConfirmPixPayment(target.id);
    }
  };

  const pendingPixCount = appointments.filter((a) => a.status === 'PENDING_PAYMENT').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter((a) => a.date === todayStr).length;

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#f4f4f5] flex flex-col font-['Plus_Jakarta_Sans'] antialiased">
      {/* Toast Notification */}
      {systemToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-2xl bg-zinc-900 border border-amber-400/40 text-xs text-white shadow-2xl flex items-center gap-2.5 animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
          <span>{systemToast.message}</span>
        </div>
      )}

      {/* Main Header & Role Switcher */}
      <Header
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        pendingPixCount={pendingPixCount}
        todayCount={todayCount}
        onOpenHandover={() => setIsHandoverOpen(true)}
      />

      {/* Handover & Delivery Modal */}
      <HandoverKitModal
        isOpen={isHandoverOpen}
        onClose={() => setIsHandoverOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-12">
        {currentRole === 'CLIENT' && (
          <ClientPWAView
            barbers={barbers}
            services={services}
            appointments={appointments}
            blockedDates={blockedDates}
            manualBlocks={manualBlocks}
            onCreateAppointment={handleCreateAppointment}
            onConfirmPixPayment={handleConfirmPixPayment}
            onConfirmPresence={handleConfirmPresence}
          />
        )}

        {currentRole === 'BARBER' && (
          <BarberDashboard
            barbers={barbers}
            services={services}
            appointments={appointments}
            blockedDates={blockedDates}
            manualBlocks={manualBlocks}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onUpdateBarberSchedule={handleUpdateBarberSchedule}
            onUpdateCommissionRate={handleUpdateCommissionRate}
            onAddManualBlock={handleAddManualBlock}
            onAddBlockedDate={handleAddBlockedDate}
            onRemoveBlockedDate={handleRemoveBlockedDate}
            onAddPromotion={handleAddPromotion}
          />
        )}

        {currentRole === 'ADMIN' && (
          <AdminDashboard
            metrics={metrics}
            barbers={barbers}
            services={services}
            appointments={appointments}
            whatsappLogs={whatsappLogs}
            onAddService={handleAddService}
            onDeleteService={handleDeleteService}
            onAddBarber={handleAddBarber}
            onUpdateCommissionRate={handleUpdateCommissionRate}
            onRunMorningCron={handleRunMorningCron}
            onSimulateWebhook={handleSimulateWebhook}
            onOpenHandover={() => setIsHandoverOpen(true)}
          />
        )}

        {currentRole === 'BLUEPRINT' && <BackendBlueprintView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-4 px-4 text-center text-xs text-zinc-500 glass-panel">
        <p>
          BarberShop Das Flores • Rua Bulgária, 405 - Manoel Sátiro, Fortaleza - CE • Next.js (PWA) + NestJS + Prisma ORM + PostgreSQL
        </p>
      </footer>
    </div>
  );
}
