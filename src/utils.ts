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
