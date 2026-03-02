/**
 * Parse a time string in various formats to minutes since midnight.
 * Supports: "7:30 PM", "3:30 AM", "08:00", "8:00 AM", "1400", "14:00"
 * Returns null if unparseable.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || !timeStr.trim()) return null;
  const s = timeStr.trim().toUpperCase();

  // Try 12-hour format: "7:30 PM", "3:30 AM", "12:00 PM", "8 AM"
  const twelveHour = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (twelveHour) {
    let h = Number.parseInt(twelveHour[1], 10);
    const m = Number.parseInt(twelveHour[2] ?? "0", 10);
    const period = twelveHour[3];
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (period === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    return h * 60 + m;
  }

  // Try 24-hour format: "14:00", "08:00", "0800"
  const twentyFourColon = s.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourColon) {
    const h = Number.parseInt(twentyFourColon[1], 10);
    const m = Number.parseInt(twentyFourColon[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  const twentyFourFour = s.match(/^(\d{2})(\d{2})$/);
  if (twentyFourFour) {
    const h = Number.parseInt(twentyFourFour[1], 10);
    const m = Number.parseInt(twentyFourFour[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  return null;
}

/**
 * Calculate hours between two time strings, handling overnight shifts.
 * Subtracts lunch break if both lunchOut and lunchIn are provided.
 * Returns null if times are invalid.
 */
export function calcRowHours(
  workStart: string,
  workEnd: string,
  lunchOut?: string,
  lunchIn?: string,
): number | null {
  const startMin = parseTimeToMinutes(workStart);
  const endMin = parseTimeToMinutes(workEnd);
  if (startMin === null || endMin === null) return null;

  let totalMin = endMin - startMin;
  // Handle overnight: if end is before start, add 24h
  if (totalMin <= 0) totalMin += 24 * 60;

  // Subtract lunch break if provided
  if (lunchOut && lunchIn) {
    const lunchOutMin = parseTimeToMinutes(lunchOut);
    const lunchInMin = parseTimeToMinutes(lunchIn);
    if (lunchOutMin !== null && lunchInMin !== null) {
      let lunchBreak = lunchInMin - lunchOutMin;
      if (lunchBreak < 0) lunchBreak += 24 * 60;
      totalMin -= lunchBreak;
    }
  }

  if (totalMin < 0) return 0;
  return Math.round(totalMin * 100) / 6000; // Convert minutes to hours, 2 decimal places
}

/**
 * Calculate hours worked from clock-in and clock-out times (legacy, HH:MM format).
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
 * Format a date string YYYY-MM-DD to MM/DD/YYYY format.
 */
export function formatDateUS(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
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

/**
 * Get the Monday (pay period start) of the current or most recent biweek.
 */
export function getCurrentPayPeriodStart(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

/**
 * Get the Sunday 13 days after the pay period start.
 */
export function getPayPeriodEnd(startDate: string): string {
  if (!startDate) return "";
  const start = new Date(startDate);
  start.setDate(start.getDate() + 13);
  return start.toISOString().split("T")[0];
}

/**
 * Get the date one day after the pay period end (for employee signature date).
 */
export function getSignatureDate(payPeriodEnd: string): string {
  if (!payPeriodEnd) return "";
  const [year, month, day] = payPeriodEnd.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + 1);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * Day offsets for each of the 7 rows in a week.
 * Pattern: Mon(0), Mon(0), Tue(1), Wed(2), Thu(3), Fri(4), Sun(6) — Saturday skipped.
 */
export const WEEK_ROW_OFFSETS = [0, 0, 1, 2, 3, 4, 6];

/**
 * Given a pay period start (Monday), compute the dates for all 14 days (7 per week).
 * Week rows follow WEEK_ROW_OFFSETS: Mon, Mon, Tue, Wed, Thu, Fri, Sun (no Saturday).
 * Week 2 is offset by 7 days from week 1.
 */
export function getPayPeriodDates(startDate: string): {
  week1: string[];
  week2: string[];
} {
  if (!startDate) return { week1: [], week2: [] };
  const start = new Date(startDate);
  const week1: string[] = [];
  const week2: string[] = [];
  for (const offset of WEEK_ROW_OFFSETS) {
    const d = new Date(start);
    d.setDate(start.getDate() + offset);
    week1.push(d.toISOString().split("T")[0]);
  }
  for (const offset of WEEK_ROW_OFFSETS) {
    const d = new Date(start);
    d.setDate(start.getDate() + 7 + offset);
    week2.push(d.toISOString().split("T")[0]);
  }
  return { week1, week2 };
}
