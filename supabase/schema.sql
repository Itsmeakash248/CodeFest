-- ==============================================================================
-- ViewPilot Pro - Supabase Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Profiles (mirrors auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger to create public.profile on auth.user sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(excluded.name, public.profiles.name),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Interview Reports & Proctoring Audit
create table if not exists public.interview_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id text not null,
  overall numeric not null,
  band text default 'Competent',
  role text default 'Candidate',
  report_json jsonb not null default '{}'::jsonb,
  source text default 'ai',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_interview_reports_user_id on public.interview_reports(user_id);
create index if not exists idx_interview_reports_created_at on public.interview_reports(created_at desc);

alter table public.interview_reports enable row level security;

create policy "Users can view own interview reports"
  on public.interview_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own interview reports"
  on public.interview_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own interview reports"
  on public.interview_reports for update
  using (auth.uid() = user_id);

create policy "Users can delete own interview reports"
  on public.interview_reports for delete
  using (auth.uid() = user_id);

-- 3. Specialist Agent Chat Sessions
create table if not exists public.chat_sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id text not null,
  title text not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id);

alter table public.chat_sessions enable row level security;

create policy "Users can view own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chat sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own chat sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- 4. Workflows & Execution Runs
create table if not exists public.workflows (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  nodes jsonb not null default '[]'::jsonb,
  runs jsonb not null default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_workflows_user_id on public.workflows(user_id);

alter table public.workflows enable row level security;

create policy "Users can view own workflows"
  on public.workflows for select
  using (auth.uid() = user_id);

create policy "Users can insert own workflows"
  on public.workflows for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workflows"
  on public.workflows for update
  using (auth.uid() = user_id);

create policy "Users can delete own workflows"
  on public.workflows for delete
  using (auth.uid() = user_id);
