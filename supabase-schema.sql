-- ============================================
-- SALON BOOKING SYSTEM: Supabase SQL Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- STYLISTS
-- ============================================
create table if not exists stylists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  name_kana text not null default '',
  bio text not null default '',
  photo_url text not null default '',
  specialties text[] not null default '{}',
  rank text not null default 'stylist' check (rank in ('director','top','senior','stylist','junior')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- MENUS
-- ============================================
create table if not exists menus (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null default '',
  price integer not null,
  price_max integer,
  duration_minutes integer not null default 60,
  category text not null default 'cut' check (category in ('cut','color','perm','treatment','set','other')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- CUSTOMERS
-- ============================================
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  line_user_id text unique,
  name text not null,
  name_kana text,
  phone text,
  email text,
  notes text,
  visit_count integer not null default 0,
  last_visit_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================
-- RESERVATIONS
-- ============================================
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  stylist_id uuid not null references stylists(id),
  menu_id uuid not null references menus(id),
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed','no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent double booking: same stylist, same date, overlapping times
create unique index if not exists reservations_no_overlap
  on reservations (stylist_id, reservation_date, start_time)
  where status != 'cancelled';

-- ============================================
-- STYLIST SCHEDULES
-- ============================================
create table if not exists stylist_schedules (
  id uuid primary key default uuid_generate_v4(),
  stylist_id uuid not null references stylists(id) on delete cascade,
  date date not null,
  is_holiday boolean not null default false,
  work_start time default '10:00',
  work_end time default '19:00',
  break_start time default '13:00',
  break_end time default '14:00',
  unique(stylist_id, date)
);

-- ============================================
-- SEED DATA
-- ============================================
insert into stylists (name, name_kana, bio, photo_url, specialties, rank) values
(
  '田中 美咲',
  'たなか みさき',
  '10年以上の経験を持つディレクター。骨格診断に基づいたカットと、透明感カラーが得意。あなたの魅力を最大限に引き出します。',
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop&crop=face',
  ARRAY['カット','カラー','骨格診断'],
  'director'
),
(
  '佐藤 蓮',
  'さとう れん',
  'トレンドに敏感なスタイリスト。ハイライト・バレイヤージュが専門で、SNSで話題のデザインカラーも対応可能。',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&crop=face',
  ARRAY['カラー','ハイライト','パーマ'],
  'top'
),
(
  '山田 花音',
  'やまだ かのん',
  '丁寧なカウンセリングが好評。お客様一人ひとりのライフスタイルに合ったスタイルをご提案します。',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
  ARRAY['カット','縮毛矯正','トリートメント'],
  'senior'
);

insert into menus (name, description, price, price_max, duration_minutes, category) values
('カット', 'シャンプー・ブロー込み。お客様の骨格に合わせた似合わせカット。', 5500, null, 60, 'cut'),
('カラー（全体）', '全体カラー。ダメージレスな薬剤使用。根元〜毛先まで均一に発色。', 8800, 12000, 90, 'color'),
('ハイライト', 'ナチュラルなハイライトで立体感と透明感をプラス。', 13200, 18000, 120, 'color'),
('パーマ', 'エアウェーブ・コールドパーマ等。ダメージを抑えたデジタルパーマも対応。', 11000, 16500, 120, 'perm'),
('縮毛矯正', '自然なストレートに。アイロン施術込み。', 16500, null, 180, 'perm'),
('トリートメント', 'システムトリートメント。集中補修で艶髪へ。', 3300, 6600, 30, 'treatment'),
('カット＋カラー', 'カット＋全体カラーのセットメニュー。お得なセット価格。', 13200, 16500, 150, 'set'),
('カット＋パーマ', 'カット＋パーマのセットメニュー。', 15400, 19800, 180, 'set');

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table stylists enable row level security;
alter table menus enable row level security;
alter table customers enable row level security;
alter table reservations enable row level security;
alter table stylist_schedules enable row level security;

-- Public read for stylists and menus
create policy "public_read_stylists" on stylists for select using (true);
create policy "public_read_menus" on menus for select using (true);
create policy "public_read_schedules" on stylist_schedules for select using (true);

-- Customers: anyone can insert (for booking), service role can manage
create policy "anyone_insert_customers" on customers for insert with check (true);
create policy "service_role_all_customers" on customers using (true);

-- Reservations: anyone can insert, service role can manage
create policy "anyone_insert_reservations" on reservations for insert with check (true);
create policy "anyone_read_reservations" on reservations for select using (true);
create policy "service_role_all_reservations" on reservations using (true);

-- ============================================
-- FUNCTION: updated_at trigger
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reservations_updated_at
  before update on reservations
  for each row execute procedure update_updated_at();

-- ============================================
-- FUNCTION: increment visit count
-- ============================================
create or replace function increment_visit_count(customer_id uuid)
returns void as $$
begin
  update customers
  set
    visit_count = visit_count + 1,
    last_visit_at = now()
  where id = customer_id;
end;
$$ language plpgsql security definer;
