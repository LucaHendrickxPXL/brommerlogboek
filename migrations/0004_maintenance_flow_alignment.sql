do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'maintenance_events'
      and column_name = 'completed_at'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_name = 'maintenance_events'
      and column_name = 'performed_at'
  ) then
    alter table maintenance_events
      rename column completed_at to performed_at;
  end if;
end;
$$;

alter table cost_entries
  add column if not exists linked_maintenance_event_id uuid references maintenance_events(id) on delete set null;

create index if not exists cost_entries_linked_maintenance_event_idx
  on cost_entries(linked_maintenance_event_id);
