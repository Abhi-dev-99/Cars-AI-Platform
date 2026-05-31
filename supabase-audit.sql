-- Cars AI Platform — audit log for Knowledge Base changes
-- Run ONCE in Supabase SQL Editor.

create table if not exists car_audit_log (
  id          uuid primary key default gen_random_uuid(),
  car_id      text,
  action      text not null check (action in ('create', 'update', 'delete')),
  diff        jsonb not null default '{}'::jsonb,
  snapshot    jsonb,
  created_at  timestamptz default now()
);

create index if not exists car_audit_car_idx     on car_audit_log (car_id);
create index if not exists car_audit_created_idx on car_audit_log (created_at desc);

alter table car_audit_log enable row level security;
-- Reads/writes happen via the backend with service_role_key (bypasses RLS).
