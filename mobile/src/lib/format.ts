// Locale-independent formatting so dates and prices look the same on every device.

export const toDay = (value: string | Date): string => String(value).slice(0, 10);

export const todayIso = (): string => toDay(new Date().toISOString());

export const formatDay = (value: string): string => {
  const [year, month, day] = toDay(value).split('-');
  return `${month}/${day}/${year}`;
};

export const formatCurrency = (value: number): string =>
  `$${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

export const isValidDayString = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
