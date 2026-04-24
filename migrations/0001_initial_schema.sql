create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  password_hash text,
  locale text not null default 'nl-BE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  brand text,
  model text,
  plate_label text,
  purchase_date date,
  purchase_price_eur numeric(12, 2),
  purchase_odometer_km integer check (purchase_odometer_km is null or purchase_odometer_km >= 0),
  insurance_provider text,
  insurance_cost_monthly_eur numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  storage_key text not null,
  original_filename text,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  width_px integer,
  height_px integer,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists vehicle_photos_primary_per_vehicle_idx
  on vehicle_photos (vehicle_id)
  where is_primary = true;

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  title text not null,
  trip_date date not null,
  distance_km numeric(8, 1) not null check (distance_km > 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  start_location_name text,
  end_location_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references trips(id) on delete cascade,
  storage_key text not null,
  original_filename text,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  width_px integer,
  height_px integer,
  created_at timestamptz not null default now()
);

create table if not exists cost_entries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  category text not null,
  title text not null,
  amount_eur numeric(12, 2) not null check (amount_eur >= 0),
  entry_date date not null,
  vendor_name text,
  location_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cost_entries_category_check check (
    category in (
      'fuel',
      'insurance',
      'maintenance',
      'taxes',
      'parking',
      'equipment',
      'repair',
      'other'
    )
  )
);

create table if not exists maintenance_rules (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  rule_type text not null default 'time_based',
  title text not null,
  description text,
  interval_months integer not null check (interval_months > 0),
  last_completed_at date,
  next_due_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_rules_type_check check (rule_type = 'time_based')
);

create table if not exists maintenance_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  maintenance_rule_id uuid references maintenance_rules(id) on delete set null,
  title text not null,
  completed_at date not null,
  workshop_name text,
  notes text,
  cost_amount_eur numeric(12, 2),
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists vehicles_user_id_idx on vehicles(user_id);
create index if not exists vehicle_photos_vehicle_id_idx on vehicle_photos(vehicle_id);
create index if not exists trips_vehicle_id_trip_date_idx on trips(vehicle_id, trip_date desc);
create index if not exists cost_entries_vehicle_id_entry_date_idx on cost_entries(vehicle_id, entry_date desc);
create index if not exists cost_entries_vehicle_id_category_idx on cost_entries(vehicle_id, category);
create index if not exists maintenance_rules_vehicle_id_due_date_idx on maintenance_rules(vehicle_id, next_due_date);
create index if not exists maintenance_events_vehicle_id_completed_at_idx on maintenance_events(vehicle_id, completed_at desc);

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row
execute function set_updated_at();

drop trigger if exists vehicles_set_updated_at on vehicles;
create trigger vehicles_set_updated_at
before update on vehicles
for each row
execute function set_updated_at();

drop trigger if exists trips_set_updated_at on trips;
create trigger trips_set_updated_at
before update on trips
for each row
execute function set_updated_at();

drop trigger if exists cost_entries_set_updated_at on cost_entries;
create trigger cost_entries_set_updated_at
before update on cost_entries
for each row
execute function set_updated_at();

drop trigger if exists maintenance_rules_set_updated_at on maintenance_rules;
create trigger maintenance_rules_set_updated_at
before update on maintenance_rules
for each row
execute function set_updated_at();
