-- ============================================================
-- Imprim Boutik — buckets de stockage (images)
-- À exécuter après schema.sql, dans le SQL Editor de Supabase
-- ============================================================

insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('article-videos', 'article-videos', true, 31457280) -- 30 Mo
on conflict (id) do nothing;

-- Lecture publique (nécessaire pour afficher les images sur la boutique)
create policy "lecture publique des images d'articles"
  on storage.objects for select
  using (bucket_id = 'article-images');

create policy "lecture publique des photos de profil"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "lecture publique des vidéos d'articles"
  on storage.objects for select
  using (bucket_id = 'article-videos');

-- Seuls les vendeurs peuvent ajouter/modifier des images d'articles
create policy "les vendeurs gèrent les images d'articles"
  on storage.objects for insert
  with check (
    bucket_id = 'article-images'
    and public.is_vendor()
  );

create policy "les vendeurs suppriment les images d'articles"
  on storage.objects for delete
  using (
    bucket_id = 'article-images'
    and public.is_vendor()
  );

-- Seuls les vendeurs peuvent ajouter/supprimer des vidéos d'articles
create policy "les vendeurs gèrent les vidéos d'articles"
  on storage.objects for insert
  with check (
    bucket_id = 'article-videos'
    and public.is_vendor()
  );

create policy "les vendeurs suppriment les vidéos d'articles"
  on storage.objects for delete
  using (
    bucket_id = 'article-videos'
    and public.is_vendor()
  );

-- Chaque utilisateur inscrit peut déposer sa propre photo de profil
create policy "un utilisateur dépose sa propre photo de profil"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );
