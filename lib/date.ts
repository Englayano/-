export function formatArabicDate(dateInput: string | Date = new Date()) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatHijriDate(dateInput: string | Date = new Date()) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function daysUntil(dateInput: string | null) {
  if (!dateInput) return null;
  const today = new Date();
  const date = new Date(`${dateInput}T23:59:59`);
  return Math.ceil((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}
