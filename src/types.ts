export type DeliveryMethod = 'ship' | 'pickup';
export type SubscriptionType = '3-month' | '6-month' | '12-month' | 'monthly';
export type SubscriberStatus = 'active' | 'lapsed' | 'upcoming';

export interface Subscriber {
  id: string;
  order: string;
  billing: string;
  billingEmail: string;
  recipient: string;
  recipientEmail: string;
  type: SubscriptionType;
  delivery: DeliveryMethod;
  start: string; // YYYY-MM
  end: string | null; // YYYY-MM
  notes: string;
  flag: boolean;
}

export interface CatalogEntry {
  artist: string;
  album: string;
  label: string;
  contact?: string;
  notes?: string;
  wholesaleCost?: number;
  predictedNew?: number;
  damageBuffer?: number; // percentage
  shopExtras?: number;
}

export type Catalog = Record<string, CatalogEntry>;

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  staffMember: string;
  category: 'subscriber' | 'catalog' | 'shipping';
}
