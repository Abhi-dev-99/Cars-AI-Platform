-- Cars AI Platform — Supabase schema
-- Run in the Supabase SQL editor: https://app.supabase.com/project/_/sql

create table if not exists cars (
  id              text primary key,
  brand           text not null,
  model           text not null,
  year            int  not null,
  price_inr       bigint not null,
  fuel_type       text not null,
  transmission    text not null,
  mileage_kmpl    numeric,
  range_km        int,
  seats           int  not null,
  body_type       text not null,
  color           text,
  location        text,
  image_url       text,
  description     text,
  features        jsonb default '[]'::jsonb,
  available       boolean default true,
  created_at      timestamptz default now()
);

create index if not exists cars_brand_idx     on cars (brand);
create index if not exists cars_fuel_type_idx on cars (fuel_type);
create index if not exists cars_body_type_idx on cars (body_type);
create index if not exists cars_price_idx     on cars (price_inr);

create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  car_id        text references cars(id),
  buyer_name    text not null,
  buyer_email   text not null,
  buyer_phone   text,
  status        text default 'pending',
  created_at    timestamptz default now()
);

create index if not exists orders_car_idx   on orders (car_id);
create index if not exists orders_email_idx on orders (buyer_email);

-- Row-level security: enable and add policies as you grow.
-- For initial dev, the backend uses the SERVICE_ROLE_KEY which bypasses RLS.
alter table cars   enable row level security;
alter table orders enable row level security;

-- Public read access to cars listings
create policy "cars are publicly readable"
  on cars for select
  using (true);
