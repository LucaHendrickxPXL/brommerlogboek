alter table users
  add column if not exists theme_preference text not null default 'auto';

update users
set theme_preference = 'auto'
where theme_preference is null
   or theme_preference not in ('auto', 'light', 'dark');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_theme_preference_check'
      and conrelid = 'users'::regclass
  ) then
    alter table users
      add constraint users_theme_preference_check
      check (theme_preference in ('auto', 'light', 'dark'));
  end if;
end $$;
