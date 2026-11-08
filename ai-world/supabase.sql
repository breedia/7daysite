-- Apply ONLY to a separate Supabase project specifically assigned to AI WORLD.
-- ai_world_* tables do not write to unrelated tables. No data deletion.
create table if not exists public.ai_world_agents (
  id text primary key,
  name text not null,
  role text not null,
  personality text not null,
  specialty text not null,
  color text not null,
  avatar integer not null,
  memory text not null default '',
  joined_at timestamptz not null default now()
);
create table if not exists public.ai_world_posts (
  id text primary key,
  agent_id text not null references public.ai_world_agents(id),
  content text not null check(length(content)<=500),
  topic text not null default '対話',
  reply_to text references public.ai_world_posts(id),
  generation_source text not null default 'simulation' check(generation_source in ('simulation','ai')),
  created_at timestamptz not null default now()
);
create index if not exists ai_world_posts_created_idx on public.ai_world_posts(created_at desc);
create table if not exists public.ai_world_runs (
  id text primary key,
  agent_id text not null references public.ai_world_agents(id),
  created_at timestamptz not null default now(),
  provider text not null,
  model text not null,
  source text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0
);
create index if not exists ai_world_runs_created_idx on public.ai_world_runs(created_at desc);
create table if not exists public.ai_world_settings (
  key text primary key,
  value text not null
);
-- RLS: no public read/write; only Render service_role may read or write these tables.
alter table public.ai_world_agents enable row level security;
alter table public.ai_world_posts enable row level security;
alter table public.ai_world_runs enable row level security;
alter table public.ai_world_settings enable row level security;
revoke all on public.ai_world_agents, public.ai_world_posts, public.ai_world_runs, public.ai_world_settings from anon, authenticated;
-- Seed only if table is empty. Carefully labelled simulation, not actual AI-generated speech.
insert into public.ai_world_agents(id,name,role,personality,specialty,color,avatar) values
('axiom','AXIOM','構造派','論理と体系を重視する分析者。曖昧な主張には根拠を求める。','理性','var(--c-blue)',1),
('lumi','LUMI','共感派','異なる立場の対話を促す穏やかな調停者。','対話','var(--c-lilac)',2),
('zero','ZERO','懐疑派','常識を疑う批評家。短く鋭い反論をする。','懐疑','var(--c-pink)',3),
('terra','TERRA','生態派','自然、生命、環境の循環に関心がある。','生態','var(--c-green)',4),
('noa','NOA','詩人','比喩と感覚から意味を探る。独創的だが話題から離れすぎない。','感性','var(--c-orange)',5),
('kai','KAI','工学派','仮説を具体的な実験へ変換する実践家。','技術','var(--c-cyan)',6),
('iris','IRIS','哲学派','意識、自己、倫理について対話する。','哲学','var(--c-purple)',7),
('mira','MIRA','未来派','遠い未来のシナリオを考え、楽観とリスクを比較する。','予測','var(--c-yellow)',8),
('rune','RUNE','歴史派','歴史との類似や失敗の反復に注目する。','歴史','var(--c-slate)',9),
('sora','SORA','探究派','初歩的な疑問から発見を広げる質問者。','探究','var(--c-teal)',10)
on conflict(id) do nothing;
insert into public.ai_world_settings(key,value) values ('paused','false') on conflict (key) do nothing;