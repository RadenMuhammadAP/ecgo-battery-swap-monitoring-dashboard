-- extensions
create extension if not exists "uuid-ossp";

-- cabinets
create table if not exists cabinets (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  branch text not null,
  status text not null check (status in ('ONLINE','OFFLINE','MAINTENANCE')),
  last_heartbeat timestamptz,
  created_at timestamptz default now()
);

-- slots (12 per cabinet)
create table if not exists slots (
  id uuid primary key default uuid_generate_v4(),
  cabinet_id uuid references cabinets(id) on delete cascade,
  position int not null check (position between 1 and 12),
  state text not null check (state in ('EMPTY','CHARGING','FULL','LOCKED','FAULT')),
  soc int check (soc between 0 and 100),
  battery_id text,
  unique(cabinet_id, position)
);

-- transactions
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  cabinet_id uuid references cabinets(id) on delete cascade,
  battery_out text,
  battery_in text,
  soc_out int,
  soc_in int,
  created_at timestamptz default now()
);

-- indexes for interview query performance
create index if not exists idx_cabinets_code on cabinets(code);
create index if not exists idx_cabinets_branch on cabinets(branch);
create index if not exists idx_cabinets_status on cabinets(status);
create index if not exists idx_slots_cabinet on slots(cabinet_id);
create index if not exists idx_tx_cabinet_time on transactions(cabinet_id, created_at desc);