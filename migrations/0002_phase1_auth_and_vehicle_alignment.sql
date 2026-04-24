alter table vehicles
  add column if not exists year integer
    check (year is null or year between 1900 and 2100);

alter table vehicles
  add column if not exists license_plate text;

update vehicles
set license_plate = coalesce(license_plate, plate_label)
where plate_label is not null;

alter table vehicles
  add column if not exists engine_cc integer
    check (engine_cc is null or engine_cc > 0);

alter table vehicles
  add column if not exists is_active boolean not null default true;

create index if not exists vehicles_user_id_active_idx
  on vehicles(user_id, is_active, created_at desc);
