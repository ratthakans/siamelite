-- Siam Elite Consulting — lead capture table
-- Run this once in Supabase: SQL Editor → New query → paste all of this → Run

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  service text,        -- "Visa" | "Property" | "Maid"
  budget text,          -- "Just exploring" | "Within 3 months" | "ASAP"
  name text not null,
  contact text not null,
  channel text,          -- Line | WhatsApp | WeChat | Phone call | Email
  source_page text       -- which page the lead came from, e.g. "/" or "/properties.html"
);

-- Row Level Security: the site uses the public "anon" key in the browser,
-- so we only allow that key to INSERT — never read, update, or delete.
-- Viewing leads should happen from the Supabase dashboard (Table Editor)
-- while logged in as the project owner, or via a service-role key on a
-- trusted server — never from the public anon key.
alter table leads enable row level security;

create policy "Public can submit leads" on leads
  for insert
  to anon
  with check (true);
