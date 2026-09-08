-- Sabreen Basheer Natural Care
-- Minimal persistent database for the existing Express app.
-- The app talks to this table only from the server using the Supabase service-role key.

create table if not exists public.store_state (
  id bigint primary key check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current whenever the store record is changed.
create or replace function public.touch_store_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_state_updated_at on public.store_state;
create trigger store_state_updated_at
before update on public.store_state
for each row execute function public.touch_store_state_updated_at();

-- No public access is needed. The Express backend uses the service-role key.
alter table public.store_state enable row level security;

-- Optional: remove any accidentally-created public policies from this table.
-- (The service role bypasses RLS.)
do $$
declare
  p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'store_state' loop
    execute format('drop policy if exists %I on public.store_state', p.policyname);
  end loop;
end $$;
