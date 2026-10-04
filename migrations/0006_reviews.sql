-- Reviews: guests post on the site; Google / TripAdvisor sync in; Degusta & others are imported by hand.
create table if not exists reviews (
  id text primary key,
  source text not null,                       -- site | google | tripadvisor | degusta | facebook | otro
  external_id text,                           -- dedupe key for synced reviews (null for site reviews)
  author text not null default '',
  author_url text,
  author_photo text,
  rating smallint not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  lang text,
  url text,                                   -- link to the original review / listing
  status text not null default 'pendiente',   -- pendiente | publicada | oculta
  reply text not null default '',             -- house reply (shown under site reviews)
  ip_hash text,                               -- salted hash, only for rate limiting
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  synced_at timestamptz,                      -- last time a synced review was seen upstream
  unique (source, external_id)
);
create index if not exists reviews_feed_idx on reviews (status, posted_at desc);
create index if not exists reviews_ip_idx on reviews (ip_hash, created_at);

-- One row per external platform: aggregate rating and sync health.
create table if not exists review_sources (
  source text primary key,
  rating numeric,
  total int,
  url text,
  synced_at timestamptz,
  error text
);
