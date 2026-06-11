-- ユーザープロフィール
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  birth_year integer,
  gender text check (gender in ('男性', '女性', 'その他', '未回答')),
  created_at timestamptz default now()
);

-- タイムカプセル
create table if not exists public.capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  memory_text text not null,
  memory_year integer,
  life_stage text,
  youtube_video_id text,
  song_title text,
  artist_name text,
  image_1 text,
  image_2 text,
  image_3 text,
  image_4 text,
  views integer default 0,
  status text default 'published' check (status in ('draft', 'generating', 'published')),
  created_at timestamptz default now()
);

-- ビューカウント用RPC
create or replace function increment_views(capsule_id uuid)
returns void as $$
  update public.capsules set views = views + 1 where id = capsule_id;
$$ language sql security definer;

-- RLS有効化
alter table public.users enable row level security;
alter table public.capsules enable row level security;

-- users ポリシー
create policy "自分のプロフィールを読める" on public.users
  for select using (auth.uid() = id);
create policy "自分のプロフィールを作成できる" on public.users
  for insert with check (auth.uid() = id);
create policy "自分のプロフィールを更新できる" on public.users
  for update using (auth.uid() = id);

-- capsules ポリシー
create policy "公開カプセルは誰でも読める" on public.capsules
  for select using (status = 'published');
create policy "自分のカプセルはすべて読める" on public.capsules
  for select using (auth.uid() = user_id);
create policy "自分のカプセルを作成できる" on public.capsules
  for insert with check (auth.uid() = user_id);
create policy "自分のカプセルを更新できる" on public.capsules
  for update using (auth.uid() = user_id);
create policy "自分のカプセルを削除できる" on public.capsules
  for delete using (auth.uid() = user_id);

-- Storage: capsule-images バケット（Supabase DashboardのStorageで公開バケットとして作成してください）
-- insert into storage.buckets (id, name, public) values ('capsule-images', 'capsule-images', true);

-- Storage ポリシー（バケット作成後に有効）
-- create policy "誰でも画像を閲覧できる" on storage.objects for select using (bucket_id = 'capsule-images');
-- create policy "認証ユーザーが画像をアップロードできる" on storage.objects for insert with check (bucket_id = 'capsule-images' and auth.role() = 'authenticated');
