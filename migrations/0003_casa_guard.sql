-- Contact details for reservation requests (read only behind the house key).
alter table holds add column if not exists name text not null default '';
alter table holds add column if not exists phone text not null default '';
alter table holds add column if not exists notes text not null default '';
-- Salted hash of the requester IP, used only for rate limiting.
alter table holds add column if not exists ip_hash text;
create index if not exists holds_ip_idx on holds (ip_hash, created_at);
create index if not exists holds_created_idx on holds (created_at);

-- Failed /admin logins, for brute-force throttling.
create table if not exists casa_attempts (
  ip_hash text not null,
  at timestamptz not null default now()
);
create index if not exists casa_attempts_idx on casa_attempts (ip_hash, at);
