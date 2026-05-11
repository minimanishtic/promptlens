-- API keys + usage tracking for the public Promere API.
-- Service role inserts/updates; user-owned reads via RLS.

create extension if not exists "pgcrypto";

create table if not exists api_keys (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  key_hash              text not null unique,
  key_prefix            text not null,
  name                  text not null default 'Default',
  tier                  text not null default 'free',
  daily_search_limit    integer not null default 20,
  daily_reverse_limit   integer not null default 5,
  daily_format_limit    integer not null default 20,
  is_active             boolean not null default true,
  last_used_at          timestamptz,
  expires_at            timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists api_keys_user_id_idx on api_keys(user_id);
create index if not exists api_keys_key_hash_idx on api_keys(key_hash);

create table if not exists api_usage (
  id            bigserial primary key,
  api_key_id    uuid not null references api_keys(id) on delete cascade,
  endpoint      text not null,
  status_code   integer not null,
  latency_ms    integer not null,
  created_at    timestamptz not null default now()
);

create index if not exists api_usage_key_created_idx
  on api_usage(api_key_id, created_at desc);
create index if not exists api_usage_key_endpoint_created_idx
  on api_usage(api_key_id, endpoint, created_at desc);

alter table api_keys  enable row level security;
alter table api_usage enable row level security;

drop policy if exists "users_read_own_keys" on api_keys;
create policy "users_read_own_keys" on api_keys
  for select using (auth.uid() = user_id);

drop policy if exists "users_update_own_keys" on api_keys;
create policy "users_update_own_keys" on api_keys
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users_read_own_usage" on api_usage;
create policy "users_read_own_usage" on api_usage
  for select using (
    exists (
      select 1 from api_keys k
      where k.id = api_usage.api_key_id
        and k.user_id = auth.uid()
    )
  );
