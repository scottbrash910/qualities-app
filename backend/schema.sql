-- Qualities — Supabase schema (phase 2: shared live data instead of per-browser demo data).
-- Run in Supabase → SQL Editor on YOUR OWN project. Nothing here is shared with any other system.
create extension if not exists pgcrypto;

create table teams (id text primary key, name_ar text not null, name_en text not null, color text);
create table supervisors (id uuid primary key default gen_random_uuid(), name text not null, email text unique not null, auth_user uuid unique);
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null, grade text, team_id text references teams(id), supervisor_id uuid references supervisors(id),
  username text unique not null, auth_user uuid unique,
  -- Owner-viewable password copy, encrypted at rest with a key stored only in Supabase Vault / Edge Function secret.
  password_enc bytea,
  virtue text, created_at timestamptz default now()
);
create table stations (id text primary key, track text not null, n int not null, title_ar text, title_en text,
  opens date, due date, force_open boolean default false, content jsonb not null default '{}'::jsonb);
create table submissions (
  id uuid primary key default gen_random_uuid(), student_id uuid references students(id) on delete cascade, station_id text references stations(id),
  status text not null check (status in ('draft','sub','ok','back')), answers jsonb default '{}'::jsonb,
  rubric jsonb, comment text, reviewed_by uuid references supervisors(id), submitted_at timestamptz, reviewed_at timestamptz,
  unique (student_id, station_id));
create table files (id uuid primary key default gen_random_uuid(), student_id uuid references students(id) on delete cascade, station_id text,
  name text, mime text, size bigint, drive_file_id text, drive_url text, created_at timestamptz default now());
create table moods (student_id uuid references students(id) on delete cascade, day date default current_date, value int check (value between 1 and 5), primary key (student_id, day));
create table recitations (id uuid primary key default gen_random_uuid(), student_id uuid references students(id) on delete cascade, ayah text,
  words_ok int, words_total int, minutes numeric, drive_url text, created_at timestamptz default now());
create table verse_sets (track text primary key, ayat text[] not null default '{}');
create table audit_log (id bigserial primary key, at timestamptz default now(), actor text, action text);

-- Roles: owner / principal / supervisor / student, kept in auth.users.app_metadata.role
create or replace function app_role() returns text language sql stable as $$ select coalesce(auth.jwt()->'app_metadata'->>'role','') $$;

alter table students enable row level security;
alter table submissions enable row level security;
alter table files enable row level security;
alter table moods enable row level security;
alter table recitations enable row level security;
alter table audit_log enable row level security;

-- Students see only themselves; supervisors see their students; principal & owner see everyone. Only owner reads password_enc (via an Edge Function).
create policy s_self on students for select using (auth_user = auth.uid() or app_role() in ('owner','principal')
  or supervisor_id in (select id from supervisors where auth_user = auth.uid()));
create policy sub_rw on submissions for all using (
  student_id in (select id from students where auth_user = auth.uid())
  or student_id in (select s.id from students s join supervisors v on v.id = s.supervisor_id where v.auth_user = auth.uid())
  or app_role() in ('owner','principal'));
create policy f_rw on files for all using (student_id in (select id from students where auth_user = auth.uid()) or app_role() in ('owner','principal','supervisor'));
create policy m_rw on moods for all using (student_id in (select id from students where auth_user = auth.uid()) or app_role() in ('owner','principal','supervisor'));
create policy r_rw on recitations for all using (student_id in (select id from students where auth_user = auth.uid()) or app_role() in ('owner','principal','supervisor'));
create policy a_owner on audit_log for all using (app_role() = 'owner');
revoke select (password_enc) on students from anon, authenticated;

insert into teams values ('experts','خبراء الإحسان','Ihsan Experts','#2B7BB9'),('ambassadors','سفراء الإحسان','Ihsan Ambassadors','#F39A1E'),('action','إحسان الإحسان','Ihsan in Action','#1E6B3C');
