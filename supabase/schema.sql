-- ============================================================
-- Imprim Boutik — schéma de base de données Supabase
-- À exécuter une fois dans : Supabase Dashboard > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES (un profil par utilisateur inscrit, client ou vendeur)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'vendor')),
  nom text,
  prenom text,
  date_naissance date,
  telephone text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- Vérifie si l'utilisateur connecté est vendeur, sans redéclencher les
-- règles de sécurité de cette même table (évite la récursion infinie).
create or replace function public.is_vendor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'vendor'
  );
$$;

grant execute on function public.is_vendor() to anon, authenticated;

alter table public.profiles enable row level security;

create policy "profils visibles par leur propriétaire et les vendeurs"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_vendor()
  );

create policy "un utilisateur crée son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "un utilisateur modifie son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "catégories visibles par tous"
  on public.categories for select
  using (true);

create policy "seuls les vendeurs gèrent les catégories"
  on public.categories for all
  using (public.is_vendor())
  with check (public.is_vendor());

-- ------------------------------------------------------------
-- ARTICLES
-- ------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  title text not null,
  description text,
  price numeric not null default 0,
  support text,
  dimensions text,
  image_url text,
  published boolean not null default false,
  views integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.articles enable row level security;

create policy "articles publiés visibles par tous, tous visibles par les vendeurs"
  on public.articles for select
  using (
    published = true
    or public.is_vendor()
  );

create policy "seuls les vendeurs gèrent les articles"
  on public.articles for all
  using (public.is_vendor())
  with check (public.is_vendor());

-- ------------------------------------------------------------
-- REVIEWS (avis + étoiles)
-- ------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  client_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "avis visibles par tous"
  on public.reviews for select
  using (true);

create policy "un client publie ses propres avis"
  on public.reviews for insert
  with check (auth.uid() = client_id);

-- Vue avec note moyenne et nombre d'avis, pratique côté frontend
create view public.articles_with_stats as
  select
    a.*,
    coalesce(avg(r.rating), 0)::numeric(3,2) as avg_rating,
    count(r.id) as review_count
  from public.articles a
  left join public.reviews r on r.article_id = a.id
  group by a.id;

-- Incrémente les vues sans donner de droit d'écriture direct sur la table
create or replace function public.increment_article_views(p_article_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.articles set views = views + 1 where id = p_article_id;
$$;

grant execute on function public.increment_article_views(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- ORDERS (paiement à la livraison)
-- ------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id),
  client_id uuid not null references public.profiles(id),
  client_name text not null,
  article_title text not null,
  price numeric not null,
  location text not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "un client voit ses propres commandes, un vendeur voit tout"
  on public.orders for select
  using (
    auth.uid() = client_id
    or public.is_vendor()
  );

create policy "un client passe ses propres commandes"
  on public.orders for insert
  with check (auth.uid() = client_id);

create policy "seul un vendeur met à jour le statut d'une commande"
  on public.orders for update
  using (public.is_vendor());

-- ------------------------------------------------------------
-- MESSAGES (discussion client <-> vendeur)
-- ------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  from_role text not null check (from_role in ('client', 'vendor')),
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "un client voit ses messages, un vendeur voit tout"
  on public.messages for select
  using (
    auth.uid() = client_id
    or public.is_vendor()
  );

create policy "un client envoie ses propres messages, un vendeur envoie à n'importe quel client"
  on public.messages for insert
  with check (
    (from_role = 'client' and auth.uid() = client_id)
    or (from_role = 'vendor' and public.is_vendor())
  );

-- ------------------------------------------------------------
-- Pour créer votre compte vendeur : inscrivez-vous normalement sur le
-- site avec votre e-mail, puis exécutez la ligne ci-dessous dans le SQL
-- Editor de Supabase (remplacez l'e-mail par le vôtre) :
--
-- update public.profiles set role = 'vendor'
--   where id = (select id from auth.users where email = 'vous@exemple.com');
-- ------------------------------------------------------------
