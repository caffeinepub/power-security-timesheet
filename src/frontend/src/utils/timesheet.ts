/**
 * Calculate hours worked from clock-in and clock-out times.
 * @param clockIn  "HH:MM" 24-hour format
 * @param clockOut "HH:MM" 24-hour format
 * @returns decimal hours, rounded to 2 decimal places
 */
export function calcHours(clockIn: string, clockOut: string): number {
  if (!clockIn || !clockOut) return 0;
  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);
  const inMinutes = inH * 60 + inM;
  let outMinutes = outH * 60 + outM;
  // Handle overnight shifts
  if (outMinutes < inMinutes) outMinutes += 24 * 60;
  const diff = (outMinutes - inMinutes) / 60;
  return Math.round(diff * 100) / 100;
}

/**
 * Get the ISO week string (Mon-Sun) start date for a given date string or today.
 */
export function getWeekStart(dateStr?: string): Date {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get the end of the week (Sunday) for a given week start date.
 */
export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format a date string YYYY-MM-DD to a readable format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format time "HH:MM" to 12-hour format with AM/PM.
 */
export function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
