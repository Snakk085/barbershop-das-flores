import React, { useState } from 'react';
import {
  Scissors,
  Clock,
  DollarSign,
  UserCheck,
  Calendar,
  Coffee,
  CheckCircle2,
  Phone,
  MessageSquare,
  AlertCircle,
  Play,
  Settings,
  ChevronRight,
  TrendingUp,
  X,
  Plus,
  Flame,
  Percent,
  Tag,
  CalendarX,
  Palmtree,
  Trash2
} from 'lucide-react';
import { Barber, Appointment, AppointmentStatus, ServiceItem, BlockedDate, ManualTimeBlock } from '../types/barbershop';
import { formatCurrency, formatPhoneNumber } from '../utils/scheduling';

interface BarberDashboardProps {
  barbers: Barber[];
  services: ServiceItem[];
  appointments: Appointment[];
  blockedDates: BlockedDate[];
  manualBlocks: ManualTimeBlock[];
  onUpdateAppointmentStatus: (appointmentId: string, newStatus: AppointmentStatus) => void;
  onUpdateBarberSchedule: (
    barberId: string,
    updates: { start: string; end: string; lunchStart: string; lunchEnd: string; daysOfWeek: number[] }
  ) => void;
  onUpdateCommissionRate: (barberId: string, rate: number) => void;
  onAddManualBlock: (barberId: string, block: { startTime: string; endTime: string; date: string; reason: string }) => void;
  onAddBlockedDate: (blockedDate: BlockedDate) => void;
  onRemoveBlockedDate: (blockedDateId: string) => void;
  onAddPromotion: (newPromo: ServiceItem) => void;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({
  barbers,
  services,
  appointments,
  blockedDates,
  manualBlocks,
  onUpdateAppointmentStatus,
  onUpdateBarberSchedule,
  onUpdateCommissionRate,
  onAddManualBlock,
  onAddBlockedDate,
  onRemoveBlockedDate,
  onAddPromotion,
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barbers[0]?.id || 'barber-andre');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'AGENDA' | 'PROMOS'>('AGENDA');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);
  const [showHolidayModal, setShowHolidayModal] = useState<boolean>(false);

  // Manual short block inputs
  const [blockStartTime, setBlockStartTime] = useState<string>('15:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('15:45');
  const [blockReason, setBlockReason] = useState<string>('Pausa para Café / Alinhamento');

  // Holiday / Full day off inputs
  const [holidayDate, setHolidayDate] = useState<string>(selectedDate);
  const [holidayScope, setHolidayScope] = useState<'BARBER_OFF' | 'GLOBAL_HOLIDAY'>('BARBER_OFF');
  const [holidayReason, setHolidayReason] = useState<string>('Folga semanal');

  // New Promotion form inputs
  const [promoName, setPromoName] = useState<string>('Combo Barba + Cabelo');
  const [promoPrice, setPromoPrice] = useState<number>(50.00);
  const [promoOriginalPrice, setPromoOriginalPrice] = useState<number>(65.00);
  const [promoDuration, setPromoDuration] = useState<number>(50);
  const [promoDeposit, setPromoDeposit] = useState<number>(15.00);
  const [promoBadge, setPromoBadge] = useState<string>('🔥 Oferta Especial');

  const activeBarber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];

  // Schedule modal form state
  const [scheduleStart, setScheduleStart] = useState<string>(activeBarber.workingHours.start);
  const [scheduleEnd, setScheduleEnd] = useState<string>(activeBarber.workingHours.end);
  const [lunchStart, setLunchStart] = useState<string>(activeBarber.workingHours.lunchStart);
  const [lunchEnd, setLunchEnd] = useState<string>(activeBarber.workingHours.lunchEnd);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(activeBarber.workingHours.daysOfWeek);

  // Check if current selectedDate is blocked for this barber
  const activeDateBlock = blockedDates.find(
    (b) => b.date === selectedDate && (b.isGlobalHoliday || b.barberId === activeBarber.id || b.barberId === 'ALL')
  );

  const [y, m, d] = selectedDate.split('-').map(Number);
  const dayOfWeekNum = new Date(y, m - 1, d).getDay();
  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const isWeeklyOff = !activeBarber.workingHours.daysOfWeek.includes(dayOfWeekNum);

  // Filter appointments for this barber and date
  const barberDayAppointments = appointments
    .filter((a) => a.barberId === activeBarber.id && a.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Compute daily metrics
  const completedOrConfirmed = barberDayAppointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED' || a.status === 'IN_PROGRESS'
  );

  const totalGrossToday = completedOrConfirmed.reduce((acc, a) => acc + a.servicePrice, 0);
  const barberCommissionToday = totalGrossToday * activeBarber.commissionRate;
  const clientsServedCount = barberDayAppointments.filter((a) => a.status === 'COMPLETED').length;

  const handleSaveSchedule = () => {
    onUpdateBarberSchedule(activeBarber.id, {
      start: scheduleStart,
      end: scheduleEnd,
      lunchStart,
      lunchEnd,
      daysOfWeek,
    });
    setShowScheduleModal(false);
  };

  const handleSaveBlock = () => {
    onAddManualBlock(activeBarber.id, {
      startTime: blockStartTime,
      endTime: blockEndTime,
      date: selectedDate,
      reason: blockReason,
    });
    setShowBlockModal(false);
  };

  const handleCreateBlockedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate) return;

    const isGlobal = holidayScope === 'GLOBAL_HOLIDAY';
    const newBlockedDate: BlockedDate = {
      id: `block-${Date.now()}`,
      date: holidayDate,
      barberId: isGlobal ? 'ALL' : activeBarber.id,
      isGlobalHoliday: isGlobal,
      reason: holidayReason || (isGlobal ? 'Feriado / Barbearia Fechada' : `Folga de ${activeBarber.name}`),
      createdAt: new Date().toISOString(),
    };

    onAddBlockedDate(newBlockedDate);
    setHolidayReason('Folga');
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName) return;

    const newPromotion: ServiceItem = {
      id: `promo-${Date.now()}`,
      name: promoName,
      price: Number(promoPrice),
      originalPrice: Number(promoOriginalPrice),
      durationMinutes: Number(promoDuration),
      depositRequired: Number(promoDeposit),
      category: 'Promoções',
      isPromotion: true,
      promoBadge: promoBadge || 'Promoção do Barbeiro',
      createdByBarberId: activeBarber.id,
      description: `Promoção criada por ${activeBarber.name}: ${promoName} com desconto especial na BarberShop Das Flores.`,
      popular: true,
    };

    onAddPromotion(newPromotion);
    setShowPromoModal(false);
  };

  const toggleDayOfWeek = (dayIndex: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  // Current barber's created promotions
  const barberPromos = services.filter((s) => s.isPromotion || s.category === 'Promoções');

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Barber Selector Bar & Date */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <img
            src={activeBarber.avatar}
            alt={activeBarber.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Barbeiro Logado:</span>
              <select
                value={selectedBarberId}
                onChange={(e) => {
                  setSelectedBarberId(e.target.value);
                  const b = barbers.find((x) => x.id === e.target.value);
                  if (b) {
                    setScheduleStart(b.workingHours.start);
                    setScheduleEnd(b.workingHours.end);
                    setLunchStart(b.workingHours.lunchStart);
                    setLunchEnd(b.workingHours.lunchEnd);
                    setDaysOfWeek(b.workingHours.daysOfWeek);
                  }
                }}
                className="bg-zinc-900 border border-zinc-700 text-amber-400 font-extrabold text-sm rounded-xl px-3 py-1 focus:outline-none focus:border-amber-400"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (BarberShop Das Flores)
                  </option>
                ))}
              </select>
            </div>
            
            {/* Inline Commission on the fly */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs text-zinc-400">Modelo de comissão:</span>
              <div className="flex flex-wrap items-center gap-1">
                {[0.40, 0.50, 0.60, 0.70].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onUpdateCommissionRate(activeBarber.id, rate)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                      activeBarber.commissionRate === rate
                        ? 'bg-amber-400 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {(rate * 100).toFixed(0)}%
                  </button>
                ))}

                {/* Opção Sem Comissão */}
                <button
                  onClick={() => onUpdateCommissionRate(activeBarber.id, 1.0)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg transition-all border ${
                    activeBarber.commissionRate === 1.0
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold shadow-sm'
                      : 'bg-zinc-900 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                  }`}
                  title="O profissional recebe 100% do corte (sem desconto da barbearia / aluguel de cadeira)"
                >
                  ✨ Sem Comissão (100% Barbeiro)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action tabs & buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setHolidayDate(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-medium focus:outline-none focus:border-amber-400"
          />

          <button
            onClick={() => {
              setHolidayDate(selectedDate);
              setShowHolidayModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-red-300 text-xs font-bold flex items-center gap-1.5 border border-red-500/30 transition-all shadow-sm"
          >
            <CalendarX className="w-3.5 h-3.5 text-red-400" />
            <span>Folgas & Feriados ({blockedDates.length})</span>
          </button>

          <button
            onClick={() => setShowPromoModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all"
          >
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>+ Criar Promoção</span>
          </button>

          <button
            onClick={() => setShowBlockModal(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/20 transition-all"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Pausa Café</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Horários & Almoço</span>
          </button>
        </div>
      </div>

      {/* Navigation between Agenda and Promotions */}
      <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveTab('AGENDA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'AGENDA'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Agenda de Atendimentos</span>
        </button>

        <button
          onClick={() => setActiveTab('PROMOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'PROMOS'
              ? 'bg-red-500 text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 fill-red-400" />
          <span>Aba de Promoções ({barberPromos.length})</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl glass-card border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Atendimentos Hoje</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {completedOrConfirmed.length}
          </div>
          <span className="text-[11px] text-zinc-500">
            {clientsServedCount} já finalizados
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Faturamento Bruto</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {formatCurrency(totalGrossToday)}
          </div>
          <span className="text-[11px] text-zinc-500">
            Cadeira do {activeBarber.name}
          </span>
        </div>

        <div className={`p-4 rounded-2xl glass-card relative overflow-hidden transition-all ${
          activeBarber.commissionRate === 1.0
            ? 'border border-emerald-500/30 bg-emerald-500/5'
            : 'border border-amber-500/20 bg-amber-500/5'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={activeBarber.commissionRate === 1.0 ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
              {activeBarber.commissionRate === 1.0 ? 'Receita Integral (Sem Comissão)' : 'Sua Comissão Líquida'}
            </span>
            <TrendingUp className={`w-4 h-4 ${activeBarber.commissionRate === 1.0 ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className={`text-2xl font-extrabold ${activeBarber.commissionRate === 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {formatCurrency(barberCommissionToday)}
          </div>
          <span className={`text-[11px] ${activeBarber.commissionRate === 1.0 ? 'text-emerald-300' : 'text-amber-300/80'}`}>
            {activeBarber.commissionRate === 1.0
              ? '✨ 100% retido pelo barbeiro (Sem desconto)'
              : `Taxa de ${(activeBarber.commissionRate * 100).toFixed(0)}% aplicada`}
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Expediente BarberShop</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {activeBarber.workingHours.start} - {activeBarber.workingHours.end}
          </div>
          <span className="text-[11px] text-zinc-500">
            Almoço: {activeBarber.workingHours.lunchStart} às {activeBarber.workingHours.lunchEnd}
          </span>
        </div>
      </div>

      {/* VIEW 1: AGENDA */}
      {activeTab === 'AGENDA' && (
        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                Agenda do Dia • {selectedDate} ({activeBarber.name})
              </h3>
              <p className="text-xs text-zinc-400">
                BarberShop Das Flores • Rua Bulgária, 405 - Manoel Sátiro
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setHolidayDate(selectedDate);
                  setShowHolidayModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-red-300 border border-red-500/30 font-semibold flex items-center gap-1.5 transition-all"
              >
                <CalendarX className="w-3.5 h-3.5 text-red-400" />
                <span>Bloquear Dia Inteiro</span>
              </button>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                {barberDayAppointments.length} agendamentos na grade
              </span>
            </div>
          </div>

          {/* ACTIVE BLOCK OR WEEKLY OFF BANNER */}
          {activeDateBlock && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <CalendarX className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-red-300">
                    {activeDateBlock.isGlobalHoliday ? '🇧🇷 Barbearia Fechada (Feriado)' : `🏖️ Dia de Folga de ${activeBarber.name}`}
                  </h4>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    Motivo: <strong>{activeDateBlock.reason}</strong> • Todos os horários deste dia estão bloqueados para os clientes no PWA.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemoveBlockedDate(activeDateBlock.id)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-red-300 border border-red-500/40 font-bold shrink-0 transition-all self-end sm:self-auto"
              >
                Desbloquear / Reabrir Este Dia
              </button>
            </div>
          )}

          {!activeDateBlock && isWeeklyOff && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">
                  <strong>Folga Semanal Recorrente:</strong> {activeBarber.name} não atende aos {weekDayLabels[dayOfWeekNum]}. O motor do PWA já bloqueia este dia para os clientes.
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="text-xs text-amber-400 font-bold hover:underline shrink-0"
              >
                Alterar Dias
              </button>
            </div>
          )}

          {barberDayAppointments.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800">
              <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400 font-medium">Nenhum cliente agendado para esta data.</p>
              <p className="text-xs text-zinc-600 mt-1">
                {activeDateBlock || isWeeklyOff
                  ? 'Este dia está indisponível para novos agendamentos.'
                  : `Os horários livres continuam abertos no PWA para clientes agendarem com ${activeBarber.name}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {barberDayAppointments.map((appt) => {
                const isPending = appt.status === 'PENDING_PAYMENT';
                const isConfirmed = appt.status === 'CONFIRMED';
                const isInProgress = appt.status === 'IN_PROGRESS';
                const isCompleted = appt.status === 'COMPLETED';

                return (
                  <div
                    key={appt.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isInProgress
                        ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/40'
                        : isConfirmed
                        ? 'bg-zinc-900/90 border-zinc-800'
                        : isCompleted
                        ? 'bg-zinc-900/50 border-zinc-800/60 opacity-80'
                        : 'bg-zinc-900/40 border-amber-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Time slot & Client info */}
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center shrink-0">
                          <span className="text-xs font-mono font-bold text-amber-400 block">
                            {appt.startTime}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {appt.endTime}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{appt.clientName}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                              {appt.code}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                            <span>{appt.serviceName}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold">
                              {formatCurrency(appt.servicePrice)}
                            </span>
                            <span>•</span>
                            <span className="text-[11px] text-emerald-400 font-medium">
                              {activeBarber.commissionRate === 1.0
                                ? `100% Barbeiro: ${formatCurrency(appt.servicePrice)} (Sem desconto)`
                                : `Sua comissão: ${formatCurrency(appt.servicePrice * activeBarber.commissionRate)}`}
                            </span>
                          </div>

                          {/* Presence badge */}
                          {appt.presenceConfirmedByClient && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
                              <CheckCircle2 className="w-3 h-3" /> Presença confirmada via WhatsApp pelo cliente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        {/* WhatsApp contact button */}
                        <a
                          href={`https://wa.me/${appt.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Fala ${appt.clientName.split(' ')[0]}! Aqui é o ${activeBarber.name} da BarberShop Das Flores (Manoel Sátiro). Confirmando seu horário hoje às ${appt.startTime}!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">WhatsApp</span>
                        </a>

                        {/* Status state transitions */}
                        {isPending && (
                          <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse font-semibold">
                            Aguardando Pix
                          </span>
                        )}

                        {isConfirmed && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(appt.id, 'IN_PROGRESS')}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                          >
                            <Play className="w-3 h-3 fill-zinc-950" />
                            <span>Iniciar Corte</span>
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(appt.id, 'COMPLETED')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Concluir</span>
                          </button>
                        )}

                        {isCompleted && (
                          <span className="text-xs px-2.5 py-1 rounded-xl bg-zinc-800 text-emerald-400 border border-zinc-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Finalizado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PROMOTIONS & COMBOS CREATOR */}
      {activeTab === 'PROMOS' && (
        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                Promoções & Combos Criados
              </h3>
              <p className="text-xs text-zinc-400">
                O barbeiro tem total autonomia para criar combos (ex: Barba + Cabelo por R$ 50,00) que aparecem automaticamente no PWA do cliente.
              </p>
            </div>

            <button
              onClick={() => setShowPromoModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Promoção de Corte/Barba</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {barberPromos.map((promo) => (
              <div
                key={promo.id}
                className="p-4 rounded-2xl bg-zinc-900 border border-red-500/30 hover:border-red-500/60 transition-all space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                    {promo.promoBadge || 'Promoção'}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {promo.durationMinutes} min
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-white">{promo.name}</h4>
                <p className="text-xs text-zinc-400 line-clamp-2">{promo.description}</p>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-amber-300">
                    Sinal Pix: {formatCurrency(promo.depositRequired)}
                  </span>
                  <div className="text-right">
                    {promo.originalPrice && (
                      <span className="text-xs text-zinc-500 line-through mr-1.5">
                        {formatCurrency(promo.originalPrice)}
                      </span>
                    )}
                    <span className="text-base font-extrabold text-amber-400">
                      {formatCurrency(promo.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: FOLGAS & FERIADOS (DIAS INTEIROS INDISPONÍVEIS) */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarX className="w-4 h-4 text-red-400" />
                Gerenciar Folgas e Feriados (Dias Inteiros)
              </h3>
              <button
                type="button"
                onClick={() => setShowHolidayModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Ao bloquear uma data inteira, o motor de agendamento bloqueia todos os horários e informa ao cliente no PWA o motivo do fechamento.
            </p>

            {/* Form to block a full day */}
            <form onSubmit={handleCreateBlockedDate} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                Bloquear Nova Data
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Data a Bloquear</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Tipo de Bloqueio</label>
                  <select
                    value={holidayScope}
                    onChange={(e: any) => setHolidayScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  >
                    <option value="BARBER_OFF">🏖️ Folga de {activeBarber.name}</option>
                    <option value="GLOBAL_HOLIDAY">🇧🇷 Feriado (Barbearia Toda Fechada)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1 text-xs">Motivo da Indisponibilidade</label>
                <input
                  type="text"
                  required
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  placeholder={holidayScope === 'GLOBAL_HOLIDAY' ? "Ex: Feriado de Finados / Natal" : "Ex: Folga semanal, Consulta médica, Férias"}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <CalendarX className="w-4 h-4" />
                <span>Confirmar Bloqueio do Dia Inteiro</span>
              </button>
            </form>

            {/* List of currently blocked dates */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Datas Atualmente Bloqueadas</span>
                <span className="text-zinc-500 text-[11px]">{blockedDates.length} registros</span>
              </h4>

              {blockedDates.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center">Nenhuma data pontual bloqueada no momento.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {blockedDates.map((block) => (
                    <div
                      key={block.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          block.isGlobalHoliday ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {block.isGlobalHoliday ? 'Feriado Geral' : 'Folga Individual'}
                        </span>
                        <div>
                          <p className="font-bold text-white font-mono">{block.date}</p>
                          <p className="text-[11px] text-zinc-400">{block.reason}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveBlockedDate(block.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-all"
                        title="Desbloquear data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowHolidayModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR PROMOÇÃO / COMBO NA HORA */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <form
            onSubmit={handleCreatePromo}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400 fill-red-400" />
                Criar Promoção / Combo do Barbeiro ({activeBarber.name})
              </h3>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Exemplo: <strong>Barba + Cabelo por R$ 50,00</strong>. Essa oferta ficará disponível imediatamente na aba de promoções para os clientes no PWA.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Título da Promoção</label>
                <input
                  type="text"
                  required
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="Ex: Barba + Cabelo das Flores"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Preço Normal (De: R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={promoOriginalPrice}
                    onChange={(e) => setPromoOriginalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Preço Promo (Por: R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-amber-400 text-amber-400 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Duração (minutos)</label>
                  <input
                    type="number"
                    step="5"
                    min="15"
                    max="180"
                    value={promoDuration}
                    onChange={(e) => setPromoDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Sinal Pix No-Show (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={promoDeposit}
                    onChange={(e) => setPromoDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Badge de Destaque</label>
                <input
                  type="text"
                  value={promoBadge}
                  onChange={(e) => setPromoBadge(e.target.value)}
                  placeholder="Ex: 🔥 Barba + Cabelo R$ 50,00"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 text-white text-xs font-bold shadow-md"
              >
                Publicar Promoção no PWA
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CONFIGURAÇÃO DE JORNADA, ALMOÇO & DIAS DA SEMANA */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Expediente, Almoço & Dias da Semana ({activeBarber.name})
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Esses horários e dias da semana são integrados diretamente ao motor de agendamento inteligente. Desmarque os dias que você não atende na semana para ficarem indisponíveis para sempre.
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Início do Expediente</label>
                  <input
                    type="time"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Fim do Expediente</label>
                  <input
                    type="time"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Início do Almoço</label>
                  <input
                    type="time"
                    value={lunchStart}
                    onChange={(e) => setLunchStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Fim do Almoço</label>
                  <input
                    type="time"
                    value={lunchEnd}
                    onChange={(e) => setLunchEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-zinc-300 font-bold">
                    Dias de Atendimento na Semana
                  </label>
                  <span className="text-[10px] text-zinc-500">Clique para ativar/desativar</span>
                </div>
                <div className="flex gap-1.5 justify-between">
                  {weekDayLabels.map((dayLabel, index) => {
                    const isWorking = daysOfWeek.includes(index);
                    return (
                      <button
                        key={dayLabel}
                        type="button"
                        onClick={() => toggleDayOfWeek(index)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border ${
                          isWorking
                            ? 'bg-amber-400 text-zinc-950 border-amber-300 font-extrabold shadow-sm'
                            : 'bg-zinc-950 text-zinc-600 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                        title={isWorking ? `Atende aos ${dayLabel}s` : `Folga aos ${dayLabel}s`}
                      >
                        {dayLabel}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Dias apagados são considerados folgas semanais e bloqueados automaticamente no PWA.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold shadow-md"
              >
                Salvar Horários
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BLOQUEAR HORÁRIO / PAUSA CAFÉ */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                Bloquear Janela Curta na Agenda ({activeBarber.name})
              </h3>
              <button
                onClick={() => setShowBlockModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Bloqueie uma pausa pontual de alguns minutos ou horas no dia de hoje.
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Horário Início</label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Horário Término</label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Motivo do Bloqueio</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Pausa para Café, Treinamento, Almoço estendido"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBlock}
                className="px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold shadow-md"
              >
                Confirmar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
