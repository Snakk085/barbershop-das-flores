import { Barber, ServiceItem, Appointment, BlockedDate, ManualTimeBlock } from '../types/barbershop';

/**
 * Calculates available time slots for a given barber, service, and date.
 * Respects:
 * - Holidays and whole-day closures (Feriados / Barbearia toda fechada)
 * - Specific barber off-days (Folga pontual do barbeiro)
 * - Days of the week off (Dias fixos de folga na semana, ex: Domingo)
 * - Working hours (start and end)
 * - Lunch break (Horário de almoço)
 * - Manual short blocks (Pausa café / alinhamento)
 * - Service duration (e.g., 30, 45, 60, 90 mins)
 * - Existing bookings (confirmed or active pending pix lock)
 */
export function calculateAvailableSlots(
  barber: Barber,
  service: ServiceItem,
  dateStr: string,
  existingAppointments: Appointment[],
  manualBlocks: ManualTimeBlock[] = [],
  blockedDates: BlockedDate[] = []
): { availableSlots: string[]; isDayOff: boolean; reason?: string } {
  // 1. Check if the entire Barbershop is closed (Feriado / Fechamento Geral)
  const globalHoliday = blockedDates.find(
    (b) => b.date === dateStr && (b.isGlobalHoliday || !b.barberId || b.barberId === 'ALL')
  );
  if (globalHoliday) {
    return {
      availableSlots: [],
      isDayOff: true,
      reason: `Barbearia fechada neste dia (${globalHoliday.reason})`,
    };
  }

  // 2. Check if this specific barber has marked this specific date as off (Folga pontual / Férias)
  const barberOffDate = blockedDates.find(
    (b) => b.date === dateStr && b.barberId === barber.id
  );
  if (barberOffDate) {
    return {
      availableSlots: [],
      isDayOff: true,
      reason: `${barber.name} indisponível nesta data (${barberOffDate.reason})`,
    };
  }

  // 3. Check regular weekly day off (e.g., Sunday or Monday)
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 6 is Saturday
  const weekDayNames = ['Domingos', 'Segundas-feiras', 'Terças-feiras', 'Quartas-feiras', 'Quintas-feiras', 'Sextas-feiras', 'Sábados'];

  if (!barber.workingHours.daysOfWeek.includes(dayOfWeek)) {
    return {
      availableSlots: [],
      isDayOff: true,
      reason: `${barber.name} não atende aos ${weekDayNames[dayOfWeek]}.`,
    };
  }

  const { start, end, lunchStart, lunchEnd } = barber.workingHours;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;

  let lunchStartTotal = -1;
  let lunchEndTotal = -1;
  if (lunchStart && lunchEnd) {
    const [lsh, lsm] = lunchStart.split(':').map(Number);
    const [leh, lem] = lunchEnd.split(':').map(Number);
    lunchStartTotal = lsh * 60 + lsm;
    lunchEndTotal = leh * 60 + lem;
  }

  // Get active busy intervals for this barber on this date
  const now = new Date();
  const busyIntervals: { start: number; end: number }[] = [];

  // Lunch break
  if (lunchStartTotal !== -1 && lunchEndTotal !== -1) {
    busyIntervals.push({ start: lunchStartTotal, end: lunchEndTotal });
  }

  // Manual short time blocks (e.g., Pausa Café)
  manualBlocks
    .filter((b) => b.date === dateStr && b.barberId === barber.id)
    .forEach((b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      busyIntervals.push({ start: sh * 60 + sm, end: eh * 60 + em });
    });

  // Appointments (CONFIRMED, IN_PROGRESS, or active PENDING_PAYMENT)
  existingAppointments
    .filter((a) => a.barberId === barber.id && a.date === dateStr)
    .filter((a) => {
      if (a.status === 'CANCELLED' || a.status === 'NO_SHOW') return false;
      if (a.status === 'PENDING_PAYMENT' && a.pixExpiresAt) {
        return new Date(a.pixExpiresAt).getTime() > now.getTime();
      }
      return true;
    })
    .forEach((a) => {
      const [sh, sm] = a.startTime.split(':').map(Number);
      const [eh, em] = a.endTime.split(':').map(Number);
      busyIntervals.push({ start: sh * 60 + sm, end: eh * 60 + em });
    });

  // Check if targetDate is today to filter past times
  const today = new Date();
  const isToday =
    today.getFullYear() === year &&
    today.getMonth() === month - 1 &&
    today.getDate() === day;
  const currentMinutesToday = today.getHours() * 60 + today.getMinutes();

  const slotIntervalMinutes = 30; // Grid step
  const availableSlots: string[] = [];

  for (
    let cursor = startTotalMinutes;
    cursor + service.durationMinutes <= endTotalMinutes;
    cursor += slotIntervalMinutes
  ) {
    const slotStart = cursor;
    const slotEnd = cursor + service.durationMinutes;

    // Filter past times if today
    if (isToday && slotStart <= currentMinutesToday + 15) {
      continue;
    }

    // Check collision: (SlotStart < BusyEnd) && (SlotEnd > BusyStart)
    const hasCollision = busyIntervals.some(
      (busy) => slotStart < busy.end && slotEnd > busy.start
    );

    if (!hasCollision) {
      const hours = Math.floor(slotStart / 60)
        .toString()
        .padStart(2, '0');
      const mins = (slotStart % 60).toString().padStart(2, '0');
      availableSlots.push(`${hours}:${mins}`);
    }
  }

  return {
    availableSlots,
    isDayOff: false,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function generateMockPixCode(amount: number, code: string): string {
  const formattedAmount = amount.toFixed(2);
  return `00020126580014br.gov.bcb.pix0136df-${code.toLowerCase()}-dasflores-pix520400005303986540${formattedAmount.length}${formattedAmount}5802BR5922BarberShop Das Flores6009Fortaleza62070503${code}6304C2D1`;
}
