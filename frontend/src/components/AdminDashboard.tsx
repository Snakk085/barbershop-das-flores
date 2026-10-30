import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Scissors,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Clock,
  Sparkles,
  Zap,
  Server,
  Layers,
  Flame,
  UserPlus,
  X
} from 'lucide-react';
import { Barber, ServiceItem, Appointment, WhatsAppNotification, BarberShopMetrics } from '../types/barbershop';
import { formatCurrency } from '../utils/scheduling';

interface AdminDashboardProps {
  metrics: BarberShopMetrics;
  barbers: Barber[];
  services: ServiceItem[];
  appointments: Appointment[];
  whatsappLogs: WhatsAppNotification[];
  onAddService: (newService: ServiceItem) => void;
  onDeleteService: (serviceId: string) => void;
  onAddBarber: (newBarber: Barber) => void;
  onUpdateCommissionRate: (barberId: string, rate: number) => void;
  onRunMorningCron: () => void;
  onSimulateWebhook: (payload: any) => void;
  onOpenHandover?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  metrics,
  barbers,
  services,
  appointments,
  whatsappLogs,
  onAddService,
  onDeleteService,
  onAddBarber,
  onUpdateCommissionRate,
  onRunMorningCron,
  onSimulateWebhook,
  onOpenHandover,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'METRICS' | 'SERVICES' | 'BARBERS' | 'WHATSAPP_CRON' | 'WEBHOOKS'>('METRICS');
  
  // New service form state
  const [showNewServiceModal, setShowNewServiceModal] = useState<boolean>(false);
  const [serviceName, setServiceName] = useState<string>('');
  const [serviceCategory, setServiceCategory] = useState<'Cabelo' | 'Barba' | 'Combos' | 'Promoções' | 'Tratamentos'>('Cabelo');
  const [serviceDuration, setServiceDuration] = useState<number>(45);
  const [servicePrice, setServicePrice] = useState<number>(50.00);
  const [serviceOriginalPrice, setServiceOriginalPrice] = useState<number>(65.00);
  const [serviceDeposit, setServiceDeposit] = useState<number>(20.00);
  const [serviceDesc, setServiceDesc] = useState<string>('');
  const [isPromo, setIsPromo] = useState<boolean>(false);

  // New barber modal state
  const [showNewBarberModal, setShowNewBarberModal] = useState<boolean>(false);
  const [barberName, setBarberName] = useState<string>('');
  const [barberSpecialties, setBarberSpecialties] = useState<string>('Degradê, Barboterapia');
  const [barberCommission, setBarberCommission] = useState<number>(50); // 50%
  const [barberPhone, setBarberPhone] = useState<string>('(85) 98800-5939');

  // Webhook simulator state
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName) return;

    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: serviceName,
      category: isPromo ? 'Promoções' : serviceCategory,
      durationMinutes: Number(serviceDuration),
      price: Number(servicePrice),
      originalPrice: isPromo ? Number(serviceOriginalPrice) : undefined,
      depositRequired: Number(serviceDeposit),
      isPromotion: isPromo,
      promoBadge: isPromo ? '🔥 Promoção Especial' : undefined,
      description: serviceDesc || 'Serviço profissional de alta precisão na BarberShop Das Flores.',
      popular: isPromo,
    };

    onAddService(newService);
    setShowNewServiceModal(false);
    setServiceName('');
    setServiceDesc('');
    setIsPromo(false);
  };

  const handleCreateBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberName) return;

    const newBarber: Barber = {
      id: `barber-${Date.now()}`,
      name: barberName,
      avatar: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
      phone: barberPhone || '+5585988005939',
      email: `${barberName.toLowerCase().replace(/\s+/g, '')}@dasflores.com`,
      specialties: barberSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
      commissionRate: barberCommission / 100,
      rating: 5.0,
      reviewCount: 0,
      workingHours: {
        start: '09:00',
        end: '20:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
        daysOfWeek: [1, 2, 3, 4, 5, 6],
      },
    };

    onAddBarber(newBarber);
    setShowNewBarberModal(false);
    setBarberName('');
  };

  const handleTriggerWebhookTest = () => {
    const pendingAppt = appointments.find((a) => a.status === 'PENDING_PAYMENT');
    const targetCode = pendingAppt ? pendingAppt.code : 'DF-TEST';
    
    setWebhookStatus('Enviando evento payment.updated (Aprovado) com assinatura HMAC SHA-256...');
    
    setTimeout(() => {
      onSimulateWebhook({
        action: 'payment.updated',
        type: 'payment',
        data: { id: `mp-${Math.floor(Math.random() * 900000)}` },
        appointmentCode: targetCode,
      });
      setWebhookStatus('✅ Webhook processado com sucesso! Status do agendamento atualizado para CONFIRMADO na agenda.');
      setTimeout(() => setWebhookStatus(null), 4000);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Admin Banner */}
      <div className="glass-card p-5 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
              Painel do Dono
            </span>
            <span className="text-xs text-zinc-400">BarberShop Das Flores • Fortaleza, CE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Gestão & Controle Global
          </h2>
          <p className="text-xs text-zinc-400">
            Rua Bulgária, 405 - Manoel Sátiro • (85) 98800-5939 • Equipe: André, Neto e Novos Barbeiros
          </p>
        </div>

        {onOpenHandover && (
          <button
            onClick={onOpenHandover}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400/40 shrink-0"
          >
            <span>📦</span>
            <span>Central de Entrega do Projeto</span>
          </button>
        )}

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveSubTab('METRICS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'METRICS'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📊 Visão Geral
          </button>
          <button
            onClick={() => setActiveSubTab('SERVICES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'SERVICES'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ✂️ Serviços & Promoções ({services.length})
          </button>
          <button
            onClick={() => setActiveSubTab('BARBERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'BARBERS'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            💈 Barbeiros ({barbers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('WHATSAPP_CRON')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'WHATSAPP_CRON'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-emerald-400 hover:text-white bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Cron</span>
          </button>
          <button
            onClick={() => setActiveSubTab('WEBHOOKS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'WEBHOOKS'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gateway Pix</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: METRICS OVERVIEW */}
      {activeSubTab === 'METRICS' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl glass-card border border-zinc-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Faturamento Mensal</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">
                {formatCurrency(metrics.totalRevenueMonth)}
              </div>
              <span className="text-[11px] text-zinc-500">
                BarberShop Das Flores
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
                <span>Taxa de No-Show</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-300">
                {metrics.noShowRate}%
              </div>
              <span className="text-[11px] text-zinc-400">
                Controle anti-falta via Pix e WhatsApp
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-zinc-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Cortes Realizados</span>
                <Scissors className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">
                {metrics.totalAppointments}
              </div>
              <span className="text-[11px] text-zinc-500">
                {metrics.confirmedCount} confirmados
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-zinc-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Sinais Pix Retidos</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400">
                {formatCurrency(metrics.pixDepositTotal)}
              </div>
              <span className="text-[11px] text-zinc-500">
                Garantia prévia contra cancelamento
              </span>
            </div>
          </div>

          {/* Quick promotion spotlight */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-red-950/20 border border-red-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500 fill-red-500" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Promoções & Combos Ativos no PWA
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Promoções criadas pelos barbeiros (ex: Barba + Cabelo por R$ 50,00) com alta conversão
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewServiceModal(true)}
                className="px-3 py-1.5 rounded-xl gold-gradient-btn text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Promoção</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {services.filter((s) => s.isPromotion).map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{p.name}</span>
                    <span className="text-[10px] text-zinc-400">{p.durationMinutes} min • Sinal: {formatCurrency(p.depositRequired)}</span>
                  </div>
                  <div className="text-right">
                    {p.originalPrice && (
                      <span className="text-[10px] text-zinc-500 line-through mr-1 block">{formatCurrency(p.originalPrice)}</span>
                    )}
                    <span className="text-sm font-extrabold text-amber-400">{formatCurrency(p.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SERVICES & PROMOS MANAGEMENT */}
      {activeSubTab === 'SERVICES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Catálogo de Serviços & Promoções</h3>
              <p className="text-xs text-zinc-400">
                O dono e os barbeiros podem cadastrar novos cortes, ajustar valores e criar promoções
              </p>
            </div>
            <button
              onClick={() => setShowNewServiceModal(true)}
              className="px-3.5 py-2 rounded-xl gold-gradient-btn text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Serviço / Promoção</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className={`p-4 rounded-2xl glass-card border flex flex-col justify-between ${
                  srv.isPromotion ? 'border-red-500/40 bg-red-500/5' : 'border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      srv.isPromotion ? 'bg-red-500/20 text-red-300' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {srv.isPromotion ? srv.promoBadge || 'Promoção' : srv.category}
                    </span>
                    <button
                      onClick={() => onDeleteService(srv.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      title="Excluir serviço"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1.5">{srv.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{srv.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" /> {srv.durationMinutes} minutos
                  </span>
                  <div className="text-right">
                    {srv.originalPrice && (
                      <span className="text-[10px] text-zinc-500 line-through mr-1.5">
                        {formatCurrency(srv.originalPrice)}
                      </span>
                    )}
                    <span className="text-base font-extrabold text-amber-400">
                      {formatCurrency(srv.price)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Sinal Pix: {formatCurrency(srv.depositRequired)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: BARBERS MANAGEMENT */}
      {activeSubTab === 'BARBERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Equipe de Barbeiros da Barbearia Das Flores</h3>
              <p className="text-xs text-zinc-400">
                Profissionais cadastrados (André, Neto e novos integrantes). Ajuste comissões na hora!
              </p>
            </div>
            <button
              onClick={() => setShowNewBarberModal(true)}
              className="px-3.5 py-2 rounded-xl gold-gradient-btn text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Adicionar Novo Barbeiro</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="p-4 rounded-2xl glass-card border border-zinc-800 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={barber.avatar}
                    alt={barber.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{barber.name}</h4>
                    <span className="text-[11px] text-zinc-400 block">
                      ⭐ {barber.rating} ({barber.reviewCount} cortes)
                    </span>
                    <span className="text-[10px] text-zinc-500">{barber.phone}</span>
                  </div>
                </div>

                {/* On-the-fly commission editor */}
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Modelo de Comissão:</span>
                    <span className={barber.commissionRate === 1.0 ? "text-emerald-400 font-extrabold text-xs" : "text-amber-400 font-extrabold text-sm"}>
                      {barber.commissionRate === 1.0 ? "✨ Sem Comissão (100%)" : `${(barber.commissionRate * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {[0.40, 0.50, 0.60, 0.70].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => onUpdateCommissionRate(barber.id, rate)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                          barber.commissionRate === rate
                            ? 'bg-amber-400 text-zinc-950 shadow-sm'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {(rate * 100).toFixed(0)}%
                      </button>
                    ))}
                    <button
                      onClick={() => onUpdateCommissionRate(barber.id, 1.0)}
                      className={`w-full py-1 text-[10px] font-bold rounded-lg transition-all border mt-1 ${
                        barber.commissionRate === 1.0
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold shadow-sm'
                          : 'bg-zinc-900 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                      }`}
                    >
                      ✨ Sem Comissão (100% Barbeiro / Aluguel de Cadeira)
                    </button>
                  </div>
                </div>

                <div className="text-xs bg-zinc-950/60 p-2 rounded-xl border border-zinc-800 space-y-1">
                  <p className="text-zinc-400">
                    <strong className="text-white">Jornada:</strong> {barber.workingHours.start} - {barber.workingHours.end}
                  </p>
                  <p className="text-zinc-400">
                    <strong className="text-white">Almoço:</strong> {barber.workingHours.lunchStart} - {barber.workingHours.lunchEnd}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {barber.specialties.map((s) => (
                      <span key={s} className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: WHATSAPP CRON ENGINE & LOGS */}
      {activeSubTab === 'WHATSAPP_CRON' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Evolution API / Baileys • BarberShop Das Flores
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1">
                Motor de WhatsApp & Fila BullMQ
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Disparo matinal às 08:00 AM para clientes de Fortaleza (Manoel Sátiro) com link interativo de presença
              </p>
            </div>

            <button
              onClick={onRunMorningCron}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Executar Cron Matinal Agora</span>
            </button>
          </div>

          {/* Logs Table */}
          <div className="glass-card rounded-2xl p-4 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Histórico de Mensagens Disparadas
              </h4>
              <span className="text-[11px] text-zinc-500">
                Total registrado: {whatsappLogs.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-2 font-semibold">Cliente</th>
                    <th className="pb-2 font-semibold">WhatsApp</th>
                    <th className="pb-2 font-semibold">Tipo</th>
                    <th className="pb-2 font-semibold">Horário</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {whatsappLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 font-bold text-white">{log.clientName}</td>
                      <td className="py-2.5 font-mono text-zinc-400">{log.phone}</td>
                      <td className="py-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {log.type === 'DAILY_REMINDER' ? 'Lembrete Matinal' : 'Confirmação'}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400 font-mono">{log.sentAt}</td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : log.status === 'READ'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {log.status === 'CONFIRMED' ? 'Presença Confirmada' : log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: WEBHOOKS & GATEWAY SIMULATOR */}
      {activeSubTab === 'WEBHOOKS' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl glass-card border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Simulador de Webhooks Pix (Mercado Pago / Asaas)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Em produção, o gateway envia uma notificação HTTP POST com chave Pix da BarberShop Das Flores. Ao confirmar, o agendamento de André ou Neto é promovido imediatamente para <code className="text-emerald-400 font-bold">CONFIRMED</code>.
            </p>

            <button
              onClick={handleTriggerWebhookTest}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Disparar Webhook Simulado de Pix Aprovado</span>
            </button>

            {webhookStatus && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{webhookStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: NEW SERVICE / PROMOTION */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <form
            onSubmit={handleCreateService}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                Cadastrar Novo Serviço ou Promoção
              </h3>
              <button
                type="button"
                onClick={() => setShowNewServiceModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <input
                type="checkbox"
                id="isPromoCheck"
                checked={isPromo}
                onChange={(e) => setIsPromo(e.target.checked)}
                className="w-4 h-4 text-amber-400 rounded accent-amber-400"
              />
              <label htmlFor="isPromoCheck" className="text-xs text-white font-bold flex items-center gap-1 cursor-pointer">
                <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                Criar como Promoção / Combo Especial (Ex: Barba + Cabelo R$ 50)
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nome do Corte / Serviço</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder={isPromo ? "Ex: Combo Barba + Cabelo Das Flores" : "Ex: Corte Degradê Navalhado"}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              {!isPromo && (
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Categoria</label>
                  <select
                    value={serviceCategory}
                    onChange={(e: any) => setServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="Cabelo">Cabelo</option>
                    <option value="Barba">Barba</option>
                    <option value="Combos">Combos</option>
                    <option value="Tratamentos">Tratamentos</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {isPromo ? (
                  <>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Preço Normal (De: R$)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={serviceOriginalPrice}
                        onChange={(e) => setServiceOriginalPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Preço Promo (Por: R$)</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={servicePrice}
                        onChange={(e) => setServicePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-amber-400 text-amber-400 font-bold font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Preço Total (R$)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Duração (minutos)</label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="180"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Sinal Pix No-Show (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={serviceDeposit}
                  onChange={(e) => setServiceDeposit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Detalhes para exibir no app do cliente..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowNewServiceModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold shadow-md"
              >
                Salvar Serviço
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NEW BARBER */}
      {showNewBarberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <form
            onSubmit={handleCreateBarber}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Cadastrar Novo Barbeiro na Equipe
              </h3>
              <button
                type="button"
                onClick={() => setShowNewBarberModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Adicione mais barbeiros além de André e Neto. O novo profissional terá seu próprio painel, horários e comissão.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nome do Barbeiro</label>
                <input
                  type="text"
                  required
                  value={barberName}
                  onChange={(e) => setBarberName(e.target.value)}
                  placeholder="Ex: Mateus"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Telefone WhatsApp</label>
                <input
                  type="text"
                  value={barberPhone}
                  onChange={(e) => setBarberPhone(e.target.value)}
                  placeholder="(85) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Especialidades (separadas por vírgula)</label>
                <input
                  type="text"
                  value={barberSpecialties}
                  onChange={(e) => setBarberSpecialties(e.target.value)}
                  placeholder="Ex: Fade, Barba, Platinado, Freestyle"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-zinc-400 font-semibold">Modelo de Comissão (%)</label>
                  <button
                    type="button"
                    onClick={() => setBarberCommission(100)}
                    className="text-[11px] font-bold text-emerald-400 hover:underline"
                  >
                    ✨ Sem Comissão (100%)
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={barberCommission}
                    onChange={(e) => setBarberCommission(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold"
                  />
                  <div className="flex gap-1">
                    {[50, 60, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBarberCommission(val)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          barberCommission === val
                            ? 'bg-amber-400 text-zinc-950 border-amber-300'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {val === 100 ? 'Sem Comissão (100%)' : `${val}%`}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Escolha 100% para barbeiro que aluga a cadeira / sem comissão da barbearia.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowNewBarberModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold shadow-md"
              >
                Cadastrar Barbeiro
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
