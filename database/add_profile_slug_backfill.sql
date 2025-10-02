-- Add and backfill unique slug on profiles
-- Run this in your Supabase SQL Editor

-- Simple slug generator function
create or replace function public.slugify_profile_name(fn text, ln text, cred text)
returns text language sql immutable as $$
  select lower(
    regexp_replace(
      coalesce(fn,'') || '-' || coalesce(ln,'') || '-' || coalesce(cred,''),
      '[^a-zA-Z0-9-]+', '-', 'g'
    )
  )
$$;

-- Backfill null slugs (dedupe by suffix -2, -3, ...)
do $$
declare r record; base text; s text; i int;
begin
  for r in select id, first_name, last_name, credential_type from profiles where slug is null loop
    base := public.slugify_profile_name(r.first_name, r.last_name, r.credential_type);
    s := base; i := 2;
    while exists(select 1 from profiles where slug = s) loop
      s := base || '-' || i::text; i := i + 1;
    end loop;
    update profiles set slug = s where id = r.id;
  end loop;
end$$;

-- Ensure unique index exists
create unique index if not exists idx_profiles_slug on profiles(slug);

-- Optional safety index for sitemap query:
create index if not exists idx_profiles_indexable on profiles(is_listed, visibility_state);
