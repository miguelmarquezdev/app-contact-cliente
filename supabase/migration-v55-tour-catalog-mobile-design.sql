-- v55: Tour catalog fields for mobile prospect/client home
alter table public.tours
  add column if not exists category text default 'day_tours',
  add column if not exists price_amount numeric,
  add column if not exists price_currency text default 'USD',
  add column if not exists duration text,
  add column if not exists image_url text,
  add column if not exists featured boolean not null default false;

create index if not exists tours_category_idx on public.tours(category);
create index if not exists tours_featured_idx on public.tours(featured);
