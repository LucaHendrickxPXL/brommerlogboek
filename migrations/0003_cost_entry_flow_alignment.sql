alter table cost_entries
  add column if not exists payment_method text;

alter table cost_entries
  add column if not exists fuel_type text;

alter table cost_entries
  add column if not exists fuel_station text;

alter table cost_entries
  add column if not exists is_full_tank boolean;

alter table cost_entries
  add column if not exists odometer_km integer
    check (odometer_km is null or odometer_km >= 0);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cost_entries_payment_method_check'
  ) then
    alter table cost_entries
      add constraint cost_entries_payment_method_check
      check (
        payment_method is null
        or payment_method in ('cash', 'card', 'bank', 'other')
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cost_entries_fuel_type_check'
  ) then
    alter table cost_entries
      add constraint cost_entries_fuel_type_check
      check (
        fuel_type is null
        or fuel_type in ('95', '98', 'diesel')
      );
  end if;
end;
$$;
