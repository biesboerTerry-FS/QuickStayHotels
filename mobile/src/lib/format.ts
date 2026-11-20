// Locale-independent formatting so dates and prices look the same on every device.

export const toDay = (value: string | Date): string => String(value).slice(0, 10);

export const todayIso = (): string => toDay(new Date().toISOString());

const pad = (value: number): string => String(value).padStart(2, '0');

/** Convert a Date to the ISO date string (YYYY-MM-DD) used by the app internally. */
export const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Convert an ISO date string to a local Date at midnight. */
export const fromIsoDate = (value: string): Date => {
  const [year, month, day] = toDay(value).split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Add (or subtract) whole days from an ISO date string. */
export const addDaysIso = (value: string, days: number): string => {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

// Display format requested by the user: DD/MM/YYYY (day / month / year).
export const formatDay = (value: string): string => {
  const [year, month, day] = toDay(value).split('-');
  return `${day}/${month}/${year}`;
};

export const formatCurrency = (value: number): string =>
  `$${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

export const isValidDayString = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
