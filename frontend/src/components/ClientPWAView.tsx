import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  QrCode,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Star,
  Flame,
  MessageSquare,
  RefreshCw,
  PhoneCall,
  ArrowLeft,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Barber, ServiceItem, Appointment, BlockedDate, ManualTimeBlock } from '../types/barbershop';
import { calculateAvailableSlots, formatCurrency, formatPhoneNumber, generateMockPixCode } from '../utils/scheduling';

interface ClientPWAViewProps {
  barbers: Barber[];
  services: ServiceItem[];
  appointments: Appointment[];
  blockedDates?: BlockedDate[];
  manualBlocks?: ManualTimeBlock[];
  onCreateAppointment: (newAppt: Appointment) => void;
  onConfirmPixPayment: (appointmentId: string) => void;
  onConfirmPresence: (appointmentId: string) => void;
}

export const ClientPWAView: React.FC<ClientPWAViewProps> = ({
  barbers,
  services,
  appointments,
  blockedDates = [],
  manualBlocks = [],
  onCreateAppointment,
  onConfirmPixPayment,
  onConfirmPresence,
}) => {
  // Navigation tabs within Client view
  const [activeTab, setActiveTab] = useState<'BOOK' | 'MY_APPOINTMENTS'>('BOOK');
  const [phoneFrameMode, setPhoneFrameMode] = useState<boolean>(true);

  // Booking Flow Steps: 1: Service, 2: Barber, 3: Date & Time, 4: Client Details, 5: Pix Payment, 6: Success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Form selections
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(services[0]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(barbers[0]);
  
  // Date selection (next 7 days)
  const [dateList, setDateList] = useState<{ dateStr: string; label: string; weekDay: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Client info
  const [clientName, setClientName] = useState<string>('Gabriel Silveira');
  const [clientPhone, setClientPhone] = useState<string>('(11) 98765-4321');
  const [clientEmail, setClientEmail] = useState<string>('gabriel.silveira@email.com');

  // Active pending appointment created
  const [currentBooking, setCurrentBooking] = useState<Appointment | null>(null);
  const [pixTimeRemaining, setPixTimeRemaining] = useState<number>(900); // 15 mins = 900s
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [isProcessingWebhook, setIsProcessingWebhook] = useState<boolean>(false);

  // Simulated WhatsApp Push banner
  const [whatsappPushNotification, setWhatsappPushNotification] = useState<{
    visible: boolean;
    title: string;
    body: string;
    time: string;
  } | null>(null);

  // Populate 7 days list on mount
  useEffect(() => {
    const list = [];
    const daysWeekNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const weekDay = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : daysWeekNames[d.getDay()];
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      list.push({ dateStr, label, weekDay });
    }
    setDateList(list);
    setSelectedDate(list[0].dateStr);
  }, []);

  // 15-minute countdown timer for active Pix
  useEffect(() => {
    let timer: any = null;
    if (currentStep === 5 && pixTimeRemaining > 0) {
      timer = setInterval(() => {
        setPixTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, pixTimeRemaining]);

  // Calculate slots dynamically
  const slotData = selectedBarber && selectedService && selectedDate
    ? calculateAvailableSlots(selectedBarber, selectedService, selectedDate, appointments, manualBlocks, blockedDates)
    : { availableSlots: [], isDayOff: false };

  const categories = ['Todos', 'Promoções', 'Cabelo', 'Barba', 'Combos', 'Tratamentos'];
  const filteredServices = selectedCategory === 'Todos'
    ? services
    : selectedCategory === 'Promoções'
    ? services.filter((s) => s.isPromotion || s.category === 'Promoções')
    : services.filter((s) => s.category === selectedCategory);

  // Trigger Pix generation and reservation lock
  const handleProceedToPix = () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedSlot) return;

    const [sh, sm] = selectedSlot.split(':').map(Number);
    const endMinutes = sh * 60 + sm + selectedService.durationMinutes;
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');
    const endTime = `${endH}:${endM}`;

    const newCode = `BF-${Math.floor(1000 + Math.random() * 9000)}`;
    const pixCode = generateMockPixCode(selectedService.depositRequired, newCode);

    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      code: newCode,
      barberId: selectedBarber.id,
      barberName: selectedBarber.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceDuration: selectedService.durationMinutes,
      clientName: clientName.trim() || 'Cliente BarberFlow',
      clientPhone: clientPhone.trim() || '+5511999999999',
      clientEmail: clientEmail.trim() || undefined,
      date: selectedDate,
      startTime: selectedSlot,
      endTime,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      depositAmount: selectedService.depositRequired,
      pixCode,
      pixExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      reminderSent: false,
      presenceConfirmedByClient: false,
    };

    onCreateAppointment(newAppointment);
    setCurrentBooking(newAppointment);
    setPixTimeRemaining(900);
    setCurrentStep(5);
  };

  // Simulate Instant Webhook Approval from Mercado Pago / Asaas
  const handleSimulateWebhookApproval = () => {
    if (!currentBooking) return;
    setIsProcessingWebhook(true);

    setTimeout(() => {
      onConfirmPixPayment(currentBooking.id);
      setIsProcessingWebhook(false);
      setCurrentStep(6);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f5d061', '#10b981', '#ffffff'],
      });

      // Show simulated WhatsApp incoming push notification
      setTimeout(() => {
        setWhatsappPushNotification({
          visible: true,
          title: '💬 WhatsApp • BarberShop Das Flores (Fortaleza)',
          body: `Agendamento ${currentBooking.code} CONFIRMADO! ✅ Seu horário com ${currentBooking.barberName} no dia ${currentBooking.date} às ${currentBooking.startTime} na BarberShop Das Flores (Manoel Sátiro) está garantido.`,
          time: 'Agora',
        });
      }, 1200);
    }, 900);
  };

  const copyPixToClipboard = () => {
    if (currentBooking?.pixCode) {
      navigator.clipboard.writeText(currentBooking.pixCode);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const minutesRemaining = Math.floor(pixTimeRemaining / 60);
  const secondsRemaining = pixTimeRemaining % 60;

  // Filter client's appointments
  const myAppointments = appointments.filter(
    (a) => a.clientPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, '') || a.clientName.toLowerCase().includes(clientName.toLowerCase().split(' ')[0])
  );

  return (
    <div className="w-full py-4 sm:py-6 px-2 sm:px-4">
      {/* WhatsApp Simulated Push Banner */}
      {whatsappPushNotification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-[92vw] sm:w-96 bg-zinc-900/95 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl animate-bounce-once transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950 font-bold shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  {whatsappPushNotification.title}
                </p>
                <p className="text-[10px] text-zinc-400">{whatsappPushNotification.time}</p>
              </div>
            </div>
            <button
              onClick={() => setWhatsappPushNotification(null)}
              className="text-zinc-500 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-200 leading-relaxed bg-zinc-950/60 p-2 rounded-xl border border-zinc-800">
            {whatsappPushNotification.body}
          </p>
          <div className="mt-2.5 flex justify-end">
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Disparo automático via Evolution API / Baileys
            </span>
          </div>
        </div>
      )}

      {/* Frame Mode Bar (Mobile View toggle) */}
      <div className="max-w-md mx-auto mb-3 flex items-center justify-between text-xs text-zinc-400 px-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-zinc-300">PWA Mobile-First Experience</span>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setPhoneFrameMode(true)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              phoneFrameMode ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Formato Celular
          </button>
          <button
            onClick={() => setPhoneFrameMode(false)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              !phoneFrameMode ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tela Cheia
          </button>
        </div>
      </div>

      {/* Container - Smartphone Mockup or Fluid View */}
      <div
        className={`mx-auto transition-all duration-300 ${
          phoneFrameMode
            ? 'max-w-md bg-zinc-950 rounded-[40px] p-3 sm:p-4 border-[6px] border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative'
            : 'max-w-3xl bg-zinc-950/90 rounded-2xl p-4 sm:p-6 border border-zinc-800 shadow-xl'
        }`}
      >
        {/* Smartphone top notch */}
        {phoneFrameMode && (
          <div className="w-32 h-4 bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-700"></div>
            <div className="w-8 h-1.5 rounded-full bg-zinc-900"></div>
          </div>
        )}

        {/* PWA Barbershop Top Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/80 p-4 mb-4">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Aberto hoje até às 20:00
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              4,9 (49 avaliações no Google)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_4dbe34ea.png"
              alt="BarberShop Das Flores"
              className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400/60 shadow-md shrink-0"
            />
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                BarberShop Das Flores
              </h2>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                Rua Bulgária, 405 - Manoel Sátiro, Fortaleza - CE
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                <span>WhatsApp: (85) 98800-5939</span>
                <span>• André & Neto</span>
              </p>
            </div>
          </div>

          {/* Navigation between New Booking & My Appointments */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                setActiveTab('BOOK');
                if (currentStep === 6) setCurrentStep(1);
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'BOOK'
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ✂️ Novo Agendamento
            </button>
            <button
              onClick={() => setActiveTab('MY_APPOINTMENTS')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'MY_APPOINTMENTS'
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📅 Meus Cortes
              {myAppointments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center">
                  {myAppointments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* VIEW: MY APPOINTMENTS */}
        {activeTab === 'MY_APPOINTMENTS' && (
          <div className="space-y-3 min-h-[380px]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Seus Agendamentos</h3>
              <span className="text-[11px] text-zinc-400">Total: {myAppointments.length}</span>
            </div>

            {myAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800">
                <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Nenhum agendamento encontrado para este número.</p>
                <button
                  onClick={() => setActiveTab('BOOK')}
                  className="mt-3 text-xs font-bold text-amber-400 hover:underline"
                >
                  Agendar meu primeiro corte agora
                </button>
              </div>
            ) : (
              myAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-md space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                      {appt.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        appt.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : appt.status === 'PENDING_PAYMENT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {appt.status === 'CONFIRMED'
                        ? '✅ Confirmado'
                        : appt.status === 'PENDING_PAYMENT'
                        ? '⏳ Aguardando Pix'
                        : appt.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{appt.serviceName}</h4>
                    <p className="text-xs text-zinc-400">Com {appt.barberName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{appt.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {appt.startTime} - {appt.endTime}
                      </span>
                    </div>
                  </div>

                  {appt.status === 'PENDING_PAYMENT' && (
                    <button
                      onClick={() => {
                        setCurrentBooking(appt);
                        setCurrentStep(5);
                        setActiveTab('BOOK');
                      }}
                      className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md"
                    >
                      Pagar Sinal Pix de {formatCurrency(appt.depositAmount)}
                    </button>
                  )}

                  {appt.status === 'CONFIRMED' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onConfirmPresence(appt.id)}
                        disabled={appt.presenceConfirmedByClient}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                          appt.presenceConfirmedByClient
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {appt.presenceConfirmedByClient ? 'Presença Confirmada' : 'Confirmar Presença'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW: BOOKING FLOW */}
        {activeTab === 'BOOK' && (
          <div>
            {/* Step indicators */}
            {currentStep <= 5 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-2">
                  <span>Passo {currentStep} de 5</span>
                  <span className="text-amber-400">
                    {currentStep === 1 && 'Escolha o Serviço'}
                    {currentStep === 2 && 'Escolha o Barbeiro'}
                    {currentStep === 3 && 'Dia e Horário'}
                    {currentStep === 4 && 'Seus Dados'}
                    {currentStep === 5 && 'Sinal Pix No-Show'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* STEP 1: SELECT SERVICE */}
            {currentStep === 1 && (
              <div className="space-y-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-amber-400 text-zinc-950 font-bold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Service Cards */}
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredServices.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/40 shadow-lg'
                            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="text-sm font-bold text-white">{service.name}</h4>
                              {service.isPromotion && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                                  <Flame className="w-2.5 h-2.5 fill-red-400" /> {service.promoBadge || 'Promoção'}
                                </span>
                              )}
                              {service.popular && !service.isPromotion && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                  <Flame className="w-2.5 h-2.5 fill-amber-400" /> Mais Pedido
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/80">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              {service.durationMinutes} min
                            </span>
                            <span className="text-[11px] text-amber-300/80 font-medium">
                              Sinal Pix: {formatCurrency(service.depositRequired)}
                            </span>
                          </div>
                          <div className="text-right">
                            {service.originalPrice && (
                              <span className="text-[10px] text-zinc-500 line-through mr-1.5">
                                {formatCurrency(service.originalPrice)}
                              </span>
                            )}
                            <span className="text-base font-extrabold text-amber-400">
                              {formatCurrency(service.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  disabled={!selectedService}
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-3 mt-2 gold-gradient-btn rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-sm"
                >
                  <span>Continuar para Barbeiro</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: SELECT BARBER */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos serviços
                </button>

                <h3 className="text-sm font-bold text-white">Escolha o Profissional</h3>
                <p className="text-xs text-zinc-400 -mt-1">
                  Cada barbeiro possui sua própria grade de horários calculada em tempo real.
                </p>

                <div className="space-y-2.5">
                  {barbers.map((barber) => {
                    const isSelected = selectedBarber?.id === barber.id;
                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/40 shadow-lg'
                            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <img
                          src={barber.avatar}
                          alt={barber.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white truncate">{barber.name}</h4>
                            <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400" /> {barber.rating}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {barber.specialties.map((spec) => (
                              <span
                                key={spec}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Expediente: {barber.workingHours.start} às {barber.workingHours.end} (Almoço: {barber.workingHours.lunchStart})
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  disabled={!selectedBarber}
                  onClick={() => setCurrentStep(3)}
                  className="w-full py-3 mt-3 gold-gradient-btn rounded-xl flex items-center justify-center gap-2 shadow-lg text-sm"
                >
                  <span>Continuar para Data e Horário</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 3: DATE & SMART TIME SLOTS */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Trocar barbeiro
                </button>

                <div>
                  <h3 className="text-sm font-bold text-white">Selecione o Dia</h3>
                  <p className="text-xs text-zinc-400">Próximos 7 dias disponíveis</p>
                </div>

                {/* Horizontal Date Picker */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
                  {dateList.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    const isHoliday = blockedDates.some(
                      (b) => b.date === item.dateStr && (b.isGlobalHoliday || !b.barberId || b.barberId === 'ALL')
                    );
                    const isBarberOff = selectedBarber
                      ? blockedDates.some((b) => b.date === item.dateStr && b.barberId === selectedBarber.id)
                      : false;
                    const [y, m, d] = item.dateStr.split('-').map(Number);
                    const dayOfWeekNum = new Date(y, m - 1, d).getDay();
                    const isWeeklyOff = selectedBarber
                      ? !selectedBarber.workingHours.daysOfWeek.includes(dayOfWeekNum)
                      : false;
                    const isClosed = isHoliday || isBarberOff || isWeeklyOff;

                    return (
                      <button
                        key={item.dateStr}
                        onClick={() => {
                          setSelectedDate(item.dateStr);
                          setSelectedSlot('');
                        }}
                        className={`flex flex-col items-center justify-center min-w-[66px] py-2.5 px-2 rounded-2xl border transition-all relative ${
                          isSelected
                            ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300 shadow-lg'
                            : isClosed
                            ? 'bg-zinc-950/80 border-red-500/30 text-zinc-400 hover:border-red-500/50'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {isClosed && (
                          <span className={`text-[8px] font-bold px-1 rounded absolute -top-1.5 shadow-sm ${
                            isHoliday ? 'bg-red-500 text-white' : 'bg-zinc-900 text-red-300 border border-red-500/40'
                          }`}>
                            {isHoliday ? 'Feriado' : 'Folga'}
                          </span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider">{item.weekDay}</span>
                        <span className="text-sm font-extrabold mt-0.5">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Slots section */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Horários Livres para {selectedService?.durationMinutes} min
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      {slotData.availableSlots.length} disponíveis
                    </span>
                  </div>

                  {slotData.isDayOff ? (
                    <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-center space-y-2">
                      <div className="w-9 h-9 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-red-300 font-extrabold">{slotData.reason}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Não há atendimento nesta data. Por favor, escolha outro dia disponível na grade acima.
                        </p>
                      </div>
                    </div>
                  ) : slotData.availableSlots.length === 0 ? (
                    <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center space-y-1">
                      <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs text-zinc-300 font-medium">Sem horários para este dia</p>
                      <p className="text-[11px] text-zinc-500">
                        Todos os horários estão reservados ou já passaram. Tente selecionar outra data acima.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                      {slotData.availableSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                                : 'bg-zinc-900/90 text-zinc-200 border-zinc-800 hover:border-amber-400/40 hover:bg-zinc-800'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Summary Box */}
                {selectedSlot && (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">
                        {selectedDate} às {selectedSlot}
                      </p>
                      <p className="text-zinc-400">
                        {selectedService?.name} • {selectedBarber?.name.split(' ')[0]}
                      </p>
                    </div>
                    <span className="text-amber-400 font-extrabold text-sm">
                      {formatCurrency(selectedService?.price || 0)}
                    </span>
                  </div>
                )}

                <button
                  disabled={!selectedSlot}
                  onClick={() => setCurrentStep(4)}
                  className="w-full py-3 mt-2 gold-gradient-btn rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-sm"
                >
                  <span>Continuar para Identificação</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 4: CLIENT IDENTIFICATION */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Trocar horário
                </button>

                <h3 className="text-sm font-bold text-white">Identificação para o Agendamento</h3>
                <p className="text-xs text-zinc-400 -mt-1">
                  Seu WhatsApp é fundamental para o envio do comprovante e do lembrete matinal anti-no-show.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Seu Nome Completo
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      WhatsApp (com DDD)
                    </label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      Enviaremos o resumo e lembrete automático neste número.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Política Anti-No-Show da Barbearia
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Para garantir sua cadeira e evitar clientes fantasmas, reservamos com um sinal Pix de{' '}
                    <strong className="text-amber-400 font-bold">
                      {formatCurrency(selectedService?.depositRequired || 20)}
                    </strong>
                    . O restante de{' '}
                    <strong className="text-white font-bold">
                      {formatCurrency((selectedService?.price || 0) - (selectedService?.depositRequired || 0))}
                    </strong>{' '}
                    é pago presencialmente após o corte.
                  </p>
                </div>

                <button
                  disabled={!clientName || !clientPhone}
                  onClick={handleProceedToPix}
                  className="w-full py-3 mt-2 gold-gradient-btn rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-sm"
                >
                  <span>Gerar Pix de {formatCurrency(selectedService?.depositRequired || 20)}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 5: PIX PAYMENT & TEMPORARY LOCK */}
            {currentStep === 5 && currentBooking && (
              <div className="space-y-3.5">
                {/* 15 min lock alert */}
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">Horário Pré-Reservado!</p>
                      <p className="text-[10px] text-zinc-300">Seu lock na agenda expira em:</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-zinc-950 font-mono font-extrabold text-amber-400 text-sm border border-amber-400/30">
                    {minutesRemaining.toString().padStart(2, '0')}:
                    {secondsRemaining.toString().padStart(2, '0')}
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-sm font-bold text-white">Pague o Sinal via Pix</h3>
                  <p className="text-xs text-zinc-400">
                    Valor do Sinal:{' '}
                    <span className="text-amber-400 font-extrabold text-sm">
                      {formatCurrency(currentBooking.depositAmount)}
                    </span>
                  </p>
                </div>

                {/* Simulated Visual QR Code */}
                <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center shadow-xl relative border-4 border-amber-400/30">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-zinc-50 rounded-lg">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                            ? 'bg-zinc-950'
                            : (i * 7) % 3 === 0
                            ? 'bg-zinc-800'
                            : 'bg-transparent'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-amber-400 flex items-center justify-center font-bold text-xs shadow-lg border border-amber-400">
                      PIX
                    </div>
                  </div>
                </div>

                {/* Pix Copia e Cola */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Código Pix Copia e Cola
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentBooking.pixCode || ''}
                      className="flex-1 px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono select-all truncate"
                    />
                    <button
                      onClick={copyPixToClipboard}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-zinc-700"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Webhook Trigger Button (Tech Demo) */}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Ouvindo Webhook Mercado Pago
                    </span>
                    <span>Modo Demonstração</span>
                  </div>

                  <button
                    onClick={handleSimulateWebhookApproval}
                    disabled={isProcessingWebhook}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    {isProcessingWebhook ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando Webhook HMAC...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Simular Pagamento Pix Realizado (Disparar Webhook)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: SUCCESS CONFIRMATION & WHATSAPP DISPATCH */}
            {currentStep === 6 && currentBooking && (
              <div className="text-center py-2 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                    Agendamento Confirmado!
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">
                    Tudo pronto, {currentBooking.clientName.split(' ')[0]}!
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Seu sinal foi computado e o horário está 100% garantido na agenda.
                  </p>
                </div>

                {/* Ticket Receipt Card */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-left space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs text-zinc-400">Código da Reserva</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {currentBooking.code}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Serviço:</span>
                      <span className="font-bold text-white">{currentBooking.serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Barbeiro:</span>
                      <span className="font-bold text-white">{currentBooking.barberName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Data e Hora:</span>
                      <span className="font-bold text-amber-300">
                        {currentBooking.date} às {currentBooking.startTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Sinal Pago (Pix):</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(currentBooking.depositAmount)} (Pago)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Restante no local:</span>
                      <span className="font-bold text-zinc-300">
                        {formatCurrency(currentBooking.servicePrice - currentBooking.depositAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp simulated direct action */}
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/5585988005939?text=${encodeURIComponent(
                      `Olá André e Neto! Acabei de agendar na BarberShop Das Flores: ${currentBooking.serviceName} com ${currentBooking.barberName} no dia ${currentBooking.date} às ${currentBooking.startTime}. Código: ${currentBooking.code}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Abrir Conversa no WhatsApp com a Barbearia</span>
                  </a>

                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setActiveTab('MY_APPOINTMENTS');
                    }}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800"
                  >
                    Ver Meus Agendamentos
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
