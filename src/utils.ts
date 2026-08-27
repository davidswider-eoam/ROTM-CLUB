import type { Subscriber, SubscriberStatus } from './types';

export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

export function isActiveForMonth(sub: Subscriber, month: string): boolean {
  if (sub.start > month) return false;
  if (sub.end && sub.end < month) return false;
  return true;
}

export function isNewThisMonth(sub: Subscriber, month: string): boolean {
  return sub.start === month;
}

export function isLapsingThisMonth(sub: Subscriber, month: string): boolean {
  return sub.end === month;
}

export function statusFor(sub: Subscriber, month: string = getCurrentMonth()): SubscriberStatus {
  if (!isActiveForMonth(sub, month)) {
    if (sub.start > month) return "upcoming";
    return "lapsed";
  }
  return "active";
}

export function fmt(ym: string | null): string {
  if (!ym || ym.includes("Invalid")) return "Open";
  const [y, m] = ym.split("-");
  if (!y || !m) return "Open";
  const d = new Date(+y, +m - 1);
  if (isNaN(d.getTime())) return "Open";
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function getDaysUntilRenewal(signupDateStr?: string): number | null {
  if (!signupDateStr) return null;
  
  // BigCommerce signup_date is usually YYYY-MM-DD
  const signupDate = new Date(signupDateStr);
  if (isNaN(signupDate.getTime())) return null;
  
  const signupDay = signupDate.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate day calculation

  // 1. Try renewal this month
  let nextRenewal = new Date(today.getFullYear(), today.getMonth(), signupDay);
  
  // 2. If it passed this month, move to next month
  if (nextRenewal < today) {
    nextRenewal = new Date(today.getFullYear(), today.getMonth() + 1, signupDay);
  }
  
  const diffTime = nextRenewal.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function addMonthsToYm(ym: string, monthsToAdd: number): string {
  if (!ym || !ym.includes('-')) return ym;
  const [yearStr, monthStr] = ym.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return ym;

  const totalMonths = (month - 1) + monthsToAdd;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = ((totalMonths % 12) + 12) % 12 + 1;
  return `${newYear}-${newMonth.toString().padStart(2, '0')}`;
}

export function getNextMonth(currentMonth?: string): string {
  const base = currentMonth || getCurrentMonth();
  return addMonthsToYm(base, 1);
}

export function calculateEndMonth(startMonth: string, type: string): string | null {
  if (!startMonth || !startMonth.includes('-')) return null;
  
  const cleanType = (type || '').toLowerCase().trim();
  if (cleanType === 'monthly') return null;

  let duration = 0;
  if (cleanType === '3-month' || cleanType === '3') duration = 3;
  else if (cleanType === '6-month' || cleanType === '6') duration = 6;
  else if (cleanType === '12-month' || cleanType === '12' || cleanType === '1-year') duration = 12;
  else {
    const match = cleanType.match(/(\d+)/);
    if (match) {
      duration = parseInt(match[1], 10);
    } else {
      return null;
    }
  }

  if (duration <= 0) return null;
  // A 3-month subscription starting 2026-01 ends in 2026-03 (adds 3 - 1 = 2 months)
  return addMonthsToYm(startMonth, duration - 1);
}

export function getMonthOptions(startYearOffset = -1, endYearOffset = 2): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let year = currentYear + startYearOffset; year <= currentYear + endYearOffset; year++) {
    for (let month = 1; month <= 12; month++) {
      const ym = `${year}-${month.toString().padStart(2, '0')}`;
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      options.push({ value: ym, label: `${label} (${ym})` });
    }
  }
  return options;
}

