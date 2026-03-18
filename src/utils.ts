import type { Subscriber, SubscriberStatus } from './types';

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

export function statusFor(sub: Subscriber, month: string = "2026-02"): SubscriberStatus {
  if (!isActiveForMonth(sub, month)) {
    if (sub.start > month) return "upcoming";
    return "lapsed";
  }
  return "active";
}

export function fmt(ym: string | null): string {
  if (!ym) return "Open";
  const [y, m] = ym.split("-");
  return new Date(+y, +m - 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}
