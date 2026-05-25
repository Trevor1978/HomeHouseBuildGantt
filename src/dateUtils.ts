const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseDate(iso);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = parseDate(startIso).getTime();
  const end = parseDate(endIso).getTime();
  return Math.max(1, Math.round((end - start) / DAY_MS));
}

export function maxDate(...dates: string[]): string {
  return dates.reduce((a, b) => (parseDate(a) >= parseDate(b) ? a : b));
}
