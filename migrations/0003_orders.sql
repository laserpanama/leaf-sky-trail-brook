create table if not exists orders (
  id text primary key,
  service text not null,
  status text not null default 'pendiente',
  total numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_idx on orders (created_at desc);

create table if not exists order_lines (
  order_id text not null,
  kind text not null,
  item_id text not null,
  qty integer not null,
  price numeric not null
);

create index if not exists order_lines_order_idx on order_lines (order_id);
