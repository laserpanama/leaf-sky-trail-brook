-- Reservation agent: booking codes, source channel, and conversation threads.
alter table holds add column if not exists code text;
alter table holds add column if not exists source text not null default 'web';
alter table holds add column if not exists thread_id text;
create unique index if not exists holds_code_idx on holds (code) where code is not null;
create index if not exists holds_phone_idx on holds (phone);

create table if not exists agent_threads (
  id text primary key,            -- "<channel>:<external id>"
  channel text not null,          -- web | telegram | whatsapp
  lang text not null default 'es',
  messages jsonb not null default '[]'::jsonb,
  turns_today integer not null default 0,
  turns_day text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_threads_updated_idx on agent_threads (updated_at);

-- Rate-limit ledger for the public chat endpoint (salted IP hash, never raw IPs).
create table if not exists agent_hits (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists agent_hits_idx on agent_hits (key, at);
