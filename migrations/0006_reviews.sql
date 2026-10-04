-- Reputation module: reviews, crisis alerts and post-visit feedback.
--  - site:        anyone posts on the public page (moderated in /admin)
--  - visita:      a guest answers the post-visit feedback link (verified by a reservation)
--  - google / tripadvisor: synced from their APIs
--  - degusta / facebook / otro: imported by hand from the panel
create table if not exists reviews (
  id text primary key,
  source text not null,
  external_id text,                           -- dedupe key for synced reviews (null otherwise)
  hold_id text,                               -- reservation behind a 'visita' review
  author text not null default '',
  author_url text,
  author_photo text,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '',
  lang text,
  url text,                                   -- link to the original review / listing
  status text not null default 'pendiente',   -- pendiente | publicada | oculta | privada (feedback the guest kept private)
  reply text not null default '',             -- house reply (shown publicly under site reviews)
  draft text not null default '',             -- AI-drafted reply, not public until saved as reply
  alert text not null default 'no',           -- no | abierta | atendida   (crisis alert state)
  ip_hash text,                               -- salted hash, only for rate limiting
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  synced_at timestamptz,                      -- last time a synced review was seen upstream
  unique (source, external_id)
);
create index if not exists reviews_feed_idx on reviews (status, posted_at desc);
create index if not exists reviews_ip_idx on reviews (ip_hash, created_at);
create index if not exists reviews_alert_idx on reviews (alert, created_at desc);
create unique index if not exists reviews_hold_idx on reviews (hold_id) where hold_id is not null;

-- One row per external platform: resolved listing id, aggregate rating and sync health.
create table if not exists review_sources (
  source text primary key,
  ext_id text,
  name text,
  rating numeric,
  total int,
  url text,
  synced_at timestamptz,
  error text
);

-- Post-visit feedback: when the invitation went out (Telegram DM or staff WhatsApp tap).
alter table holds add column if not exists feedback_at timestamptz;
