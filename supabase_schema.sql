-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Subscribers Table
create table subscribers (
  id uuid default uuid_generate_v4() primary key,
  order_id text,
  billing_name text not null,
  billing_email text,
  recipient_name text not null,
  recipient_email text,
  subscription_type text not null, -- '3-month', '6-month', '12-month', 'monthly'
  delivery_method text not null,   -- 'ship', 'pickup'
  start_month text not null,       -- YYYY-MM
  end_month text,                  -- YYYY-MM
  notes: text,
  is_flagged: boolean default false,
  signup_date: date,
  shipped_months: text[] default '{}', -- Array of 'YYYY-MM' strings
  created_at: timestamptz default now()
  );

-- Catalog Table
create table catalog (
  month text primary key, -- YYYY-MM
  artist text not null,
  album text not null,
  label text,
  contact_info text,
  notes text,
  wholesale_cost numeric,
  predicted_new integer default 0,
  damage_buffer integer default 5,
  shop_extras integer default 0,
  jxn_subs integer default 0,
  updated_at timestamptz default now()
);

-- History/Logs Table
create table history (
  id uuid default uuid_generate_v4() primary key,
  action text not null,
  details text,
  staff_member text default 'Admin',
  category text not null, -- 'subscriber', 'catalog', 'shipping'
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table subscribers enable row level security;
alter table catalog enable row level security;
alter table history enable row level security;

-- Create Policies (Allow authenticated users to read/write)
-- Subscribers
create policy "Enable read access for authenticated users" on subscribers for select using (auth.role() = 'authenticated');
create policy "Enable insert access for authenticated users" on subscribers for insert with check (auth.role() = 'authenticated');
create policy "Enable update access for authenticated users" on subscribers for update using (auth.role() = 'authenticated');
create policy "Enable delete access for authenticated users" on subscribers for delete using (auth.role() = 'authenticated');

-- Catalog
create policy "Enable all access for authenticated users" on catalog for all using (auth.role() = 'authenticated');

-- History
create policy "Enable all access for authenticated users" on history for all using (auth.role() = 'authenticated');
