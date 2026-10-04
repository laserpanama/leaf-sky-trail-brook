-- Floor service: waiters take orders by table; kitchen and bar each mark their part ready; the bar charges.
alter table orders add column if not exists source text not null default 'web';        -- web | mesero
alter table orders add column if not exists table_label text not null default '';      -- "Mesa 4", "Barra 2", "Llevar"
alter table orders add column if not exists waiter text not null default '';
alter table orders add column if not exists note text not null default '';
-- Per-station state: pendiente | listo | na (no lines for that station / not sent yet).
-- Web orders start as 'na' until the bar accepts them, so a prank order never reaches the kitchen.
alter table orders add column if not exists kitchen_status text not null default 'na';
alter table orders add column if not exists bar_status text not null default 'na';
alter table orders add column if not exists kitchen_ready_at timestamptz;
alter table orders add column if not exists bar_ready_at timestamptz;
alter table orders add column if not exists paid_at timestamptz;
alter table order_lines add column if not exists note text not null default '';
create index if not exists orders_open_idx on orders (pay_status, status, created_at desc);
create index if not exists orders_kitchen_idx on orders (kitchen_status, created_at);
create index if not exists orders_bar_idx on orders (bar_status, created_at);
