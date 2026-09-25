alter table orders add column if not exists pay text not null default 'efectivo';
alter table orders add column if not exists pay_status text not null default 'pendiente';
