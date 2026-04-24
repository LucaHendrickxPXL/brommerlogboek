do $$
begin
  if exists (
    select 1
    from (
      select lower(trim(email)) as normalized_email
      from users
      group by lower(trim(email))
      having count(*) > 1
    ) duplicate_emails
  ) then
    raise exception 'Cannot enable multi-user auth: duplicate e-mail addresses exist after normalization.';
  end if;
end
$$;

update users
set email = lower(trim(email))
where email <> lower(trim(email));

create unique index if not exists users_email_lower_unique_idx
  on users (lower(email));
