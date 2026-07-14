-- ============================================================================
-- Siam Elite — Back-office schema
-- ----------------------------------------------------------------------------
-- HOW TO RUN (one time):
--   Supabase dashboard → SQL Editor → New query → paste ALL of this → Run.
--
-- This is IDEMPOTENT and NON-DESTRUCTIVE:
--   • The "properties" table already exists with 45 rows — this only ADDS the
--     missing columns (id, published, sort_order, created_at) and turns on
--     security. Your existing listing data is left untouched.
--   • Safe to re-run any time.
-- ============================================================================

-- ---------- helper: auto-update updated_at ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 1. PROPERTIES  — upgrade the existing table (do NOT recreate)
-- ============================================================================
-- If the table somehow doesn't exist yet, create a minimal shell; the ALTERs
-- below then fill in every column. On the real project the table already
-- exists, so this create is a no-op.
create table if not exists properties (
  code text primary key
);

-- Add every column we rely on, only if missing. Existing columns stay as-is.
alter table properties add column if not exists id           uuid default gen_random_uuid();
alter table properties add column if not exists published    boolean not null default true;
alter table properties add column if not exists featured     boolean not null default false;
alter table properties add column if not exists status       text;
alter table properties add column if not exists type         text;
alter table properties add column if not exists location     text;
alter table properties add column if not exists location_th  text;
alter table properties add column if not exists location_en  text;
alter table properties add column if not exists location_zh  text;
alter table properties add column if not exists title_th     text;
alter table properties add column if not exists title_en     text;
alter table properties add column if not exists title_zh     text;
alter table properties add column if not exists desc_th      text;
alter table properties add column if not exists desc_en      text;
alter table properties add column if not exists desc_zh      text;
alter table properties add column if not exists beds         int;
alter table properties add column if not exists baths        int;
alter table properties add column if not exists sqm          int;
alter table properties add column if not exists land_sqm     int;
alter table properties add column if not exists parking      int;
alter table properties add column if not exists floor        int;
alter table properties add column if not exists furnished    text;
alter table properties add column if not exists ownership    text;
alter table properties add column if not exists price_th     text;
alter table properties add column if not exists price_en     text;
alter table properties add column if not exists tier         text;
alter table properties add column if not exists image        text;
alter table properties add column if not exists gallery      jsonb not null default '[]';
alter table properties add column if not exists features     jsonb not null default '[]';
alter table properties add column if not exists sort_order   int not null default 0;
alter table properties add column if not exists created_at   timestamptz not null default now();
alter table properties add column if not exists updated_at   timestamptz not null default now();

-- Make "id" a proper, unique row identifier (the admin panel edits/deletes by id).
-- Backfill any rows that predate the id column.
update properties set id = gen_random_uuid() where id is null;
alter table properties alter column id set not null;
create unique index if not exists properties_id_key on properties (id);

-- "code" must be unique so it can be a foreign-key target and so upserts work.
create unique index if not exists properties_code_key on properties (code);

-- Give listings a stable display order (by code) the first time only.
update properties p set sort_order = s.rn
  from (select code, (row_number() over (order by code)) - 1 as rn from properties) s
  where p.code = s.code and p.sort_order = 0;

-- keep updated_at fresh on every edit
drop trigger if exists properties_updated_at on properties;
create trigger properties_updated_at
  before update on properties
  for each row execute function set_updated_at();

-- ---- Row Level Security ----
alter table properties enable row level security;

-- Public (anon key used by the live website) reads PUBLISHED listings only.
drop policy if exists "Public read published properties" on properties;
create policy "Public read published properties" on properties
  for select to anon using (published = true);

-- Logged-in staff can read everything (incl. drafts) and fully manage listings.
drop policy if exists "Staff read all properties" on properties;
create policy "Staff read all properties" on properties
  for select to authenticated using (true);

drop policy if exists "Staff insert properties" on properties;
create policy "Staff insert properties" on properties
  for insert to authenticated with check (true);

drop policy if exists "Staff update properties" on properties;
create policy "Staff update properties" on properties
  for update to authenticated using (true) with check (true);

drop policy if exists "Staff delete properties" on properties;
create policy "Staff delete properties" on properties
  for delete to authenticated using (true);

-- ============================================================================
-- 2. DOCUMENTS  (metadata; the actual files live in the "documents" bucket)
-- ============================================================================
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category      text,                          -- "contract" | "brochure" | "visa" | "id" | "other"
  file_path     text not null,                 -- path inside the "documents" storage bucket
  file_name     text,
  file_size     bigint,
  mime_type     text,
  property_code text references properties(code) on delete set null,
  lead_id       uuid references leads(id) on delete set null,
  note          text,
  uploaded_by   uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

alter table documents enable row level security;

-- Documents are private: only logged-in staff. No anon access at all.
drop policy if exists "Staff read documents" on documents;
create policy "Staff read documents" on documents
  for select to authenticated using (true);

drop policy if exists "Staff insert documents" on documents;
create policy "Staff insert documents" on documents
  for insert to authenticated with check (true);

drop policy if exists "Staff update documents" on documents;
create policy "Staff update documents" on documents
  for update to authenticated using (true) with check (true);

drop policy if exists "Staff delete documents" on documents;
create policy "Staff delete documents" on documents
  for delete to authenticated using (true);

-- ============================================================================
-- 3. LEADS  — upgrade the existing table so staff can track follow-ups
-- ============================================================================
alter table leads add column if not exists status     text not null default 'new'; -- new | contacted | won | lost
alter table leads add column if not exists staff_note text;

-- The existing policy already lets the public (anon) INSERT. Add staff read+update.
drop policy if exists "Staff can read leads" on leads;
create policy "Staff can read leads" on leads
  for select to authenticated using (true);

drop policy if exists "Staff can update leads" on leads;
create policy "Staff can update leads" on leads
  for update to authenticated using (true) with check (true);

-- ============================================================================
-- 4. STORAGE BUCKETS + policies
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('property-images', 'property-images', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- --- property-images: public read, staff write ---
drop policy if exists "Public read property images" on storage.objects;
create policy "Public read property images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-images');

drop policy if exists "Staff write property images" on storage.objects;
create policy "Staff write property images" on storage.objects
  for insert to authenticated with check (bucket_id = 'property-images');

drop policy if exists "Staff update property images" on storage.objects;
create policy "Staff update property images" on storage.objects
  for update to authenticated using (bucket_id = 'property-images');

drop policy if exists "Staff delete property images" on storage.objects;
create policy "Staff delete property images" on storage.objects
  for delete to authenticated using (bucket_id = 'property-images');

-- --- documents: staff only, no anon ---
drop policy if exists "Staff read documents bucket" on storage.objects;
create policy "Staff read documents bucket" on storage.objects
  for select to authenticated using (bucket_id = 'documents');

drop policy if exists "Staff write documents bucket" on storage.objects;
create policy "Staff write documents bucket" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');

drop policy if exists "Staff delete documents bucket" on storage.objects;
create policy "Staff delete documents bucket" on storage.objects
  for delete to authenticated using (bucket_id = 'documents');

-- ============================================================================
-- Done. Next: create a staff login under Authentication → Users → Add user
-- (email + password). Then open /admin on the site and sign in.
-- ============================================================================
