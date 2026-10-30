export type UserRole = 'ADMIN' | 'BARBER' | 'CLIENT';

export type AppointmentStatus = 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'EXPIRED';

export interface Barber {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  specialties: string[];
  commissionRate: number; // e.g. 0.50 = 50%, 1.0 = 100% (Sem comissão)
  commissionType?: 'PERCENTAGE' | 'NO_COMMISSION'; // 'NO_COMMISSION' = 100% para o barbeiro
  rating: number;
  reviewCount: number;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "20:00"
    lunchStart: string; // "12:00"
    lunchEnd: string;   // "13:00"
    daysOfWeek: number[]; // [1, 2, 3, 4, 5, 6] (Segunda a Sábado, 0 = Domingo)
  };
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  originalPrice?: number;
  depositRequired: number; // Sinal Pix No-Show (ex: R$ 15,00)
  category: 'Cabelo' | 'Barba' | 'Combos' | 'Promoções' | 'Tratamentos';
  isPromotion?: boolean;
  promoBadge?: string;
  createdByBarberId?: string;
  popular?: boolean;
}

export interface BlockedDate {
  id: string;
  date: string; // "YYYY-MM-DD"
  barberId?: string; // 'ALL' ou undefined = Feriado / Fechamento total da barbearia; ou barberId específico
  isGlobalHoliday?: boolean; // Se a barbearia inteira não abre
  reason: string; // Ex: "Feriado de Finados", "Folga Semanal", "Treinamento", "Férias"
  createdAt: string;
}

export interface ManualTimeBlock {
  id?: string;
  barberId: string;
  startTime: string; // "15:00"
  endTime: string;   // "15:45"
  date: string;      // "YYYY-MM-DD"
  reason: string;
}

export interface Appointment {
  id: string;
  code: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  depositAmount: number;
  pixCode?: string;
  pixQrCodeUrl?: string;
  pixExpiresAt?: string;
  createdAt: string;
  confirmedAt?: string;
  reminderSent?: boolean;
  presenceConfirmedByClient?: boolean;
}

export interface WhatsAppNotification {
  id: string;
  appointmentId: string;
  phone: string;
  clientName: string;
  type: 'BOOKING_CONFIRMATION' | 'DAILY_REMINDER' | 'CANCELLATION';
  message: string;
  sentAt: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'CONFIRMED';
}

export interface BarberShopMetrics {
  totalRevenueMonth: number;
  totalAppointments: number;
  confirmedCount: number;
  noShowCount: number;
  noShowRate: number;
  averageTicket: number;
  pixDepositTotal: number;
}
