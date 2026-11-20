import { isValidDayString, todayIso } from './format';
import { isValidRange } from './bookings';

// Returns an error message, or null when the stay details are usable.
export const validateStay = (
  { checkIn, checkOut, guests }: { checkIn: string; checkOut: string; guests: string },
  { requireDates = true, maxGuests = 8 }: { requireDates?: boolean; maxGuests?: number } = {},
): string | null => {
  if (requireDates || checkIn || checkOut) {
    if (!isValidDayString(checkIn) || !isValidDayString(checkOut)) {
      return 'Choose both dates in DD/MM/YYYY format.';
    }
    if (checkIn < todayIso()) return "Check-in can't be in the past.";
    if (!isValidRange(checkIn, checkOut)) return 'Check-out must be at least one night after check-in.';
  }
  if (guests) {
    const count = Number(guests);
    if (!Number.isInteger(count) || count < 1 || count > maxGuests) {
      return `Guests must be a number between 1 and ${maxGuests}.`;
    }
  }
  return null;
};
