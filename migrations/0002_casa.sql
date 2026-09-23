create table if not exists holds (
  id text primary key,
  day text not null,
  slot text not null,
  party integer not null,
  status text not null default 'pendiente',
  created_at timestamptz not null default now()
);

create index if not exists holds_day_idx on holds (day, slot);

create table if not exists menu_overrides (
  kind text not null,
  item_id text not null,
  price numeric,
  available boolean,
  primary key (kind, item_id)
);

create table if not exists casa_json (
  key text primary key,
  doc jsonb not null
);
