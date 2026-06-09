-- ═══════════════════════════════════════════════════════════════
--  CoWork — Supabase schema
--  Run this in: supabase.com → your project → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- Captures: phone input (ideas, questions, links, observations)
create table captures (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  project     text not null,   -- 'hedging' | 'portal' | 'design' | 'other'
  type        text not null,   -- 'idea' | 'question' | 'link' | 'observation'
  content     text not null,
  created_at  timestamptz default now()
);

-- Tasks: full kanban (replaces TASKS.md)
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  section     text not null default 'active', -- 'active' | 'waiting' | 'someday' | 'done'
  project     text,            -- 'hedging' | 'portal' | 'design' | 'other'
  priority    boolean default false,
  done        boolean default false,
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Intel: blockers, questions, decisions, actions
create table intel (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null,   -- 'blocker' | 'question' | 'decision' | 'action'
  project     text,            -- 'hedging' | 'portal'
  content     jsonb not null,  -- flexible shape per type (see below)
  urgent      boolean default false,
  resolved    boolean default false,
  created_at  timestamptz default now()
);
-- content shapes:
--   blocker:   { description, impact, owner, due }
--   question:  { text, priority, context, blocker }
--   decision:  { text, approved_by }
--   action:    { text, owner, due }

-- LinkedIn posts
create table linkedin_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  status      text not null default 'idea', -- 'idea' | 'drafting' | 'ready' | 'posted'
  topic       text,
  hook        text default '',
  content     text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Row-level security (each user sees only their own rows) ──
alter table captures      enable row level security;
alter table tasks         enable row level security;
alter table intel         enable row level security;
alter table linkedin_posts enable row level security;

create policy "own captures"  on captures       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks"     on tasks          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own intel"     on intel          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own li posts"  on linkedin_posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Real-time (enable for live dashboard updates) ──
alter publication supabase_realtime add table captures;
alter publication supabase_realtime add table tasks;
