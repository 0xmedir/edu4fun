-- =========================================================
-- EDU4FUN — CORE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- =========================================================

-- ---------- ACCESS CONTROL ----------

create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[0-9]{6}$'),
  assigned_email text,
  status text not null default 'unused' check (status in ('unused','used','expired')),
  expires_at timestamptz not null,
  created_by uuid references auth.users(id),
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'student' check (role in ('student','instructor','admin')),
  access_code_id uuid references public.access_codes(id),
  created_at timestamptz not null default now()
);

-- Helper: check role without triggering RLS recursion on public.users.
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- ---------- CONTENT HIERARCHY ----------

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  semester text,
  credit_hours int,
  syllabus_url text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  week_number int,
  learning_objectives text[],
  order_index int not null default 0
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  content_richtext text,
  video_url text,
  pdf_url text,
  order_index int not null default 0
);

-- ---------- TUTORIAL LIBRARY ----------

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  file_url text not null,
  uploaded_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.subject_tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table public.book_tags (
  book_id uuid references public.books(id) on delete cascade,
  tag_id uuid references public.subject_tags(id) on delete cascade,
  primary key (book_id, tag_id)
);

-- ---------- EXERCISE ENGINE ----------

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  type text not null check (type in ('mcq','open')),
  difficulty text check (difficulty in ('beginner','intermediate','advanced')),
  bloom_level text check (bloom_level in ('remember','understand','apply')),
  question_text text not null,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.question_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false
);

create table public.answer_keys (
  id uuid primary key default gen_random_uuid(),
  question_id uuid unique not null references public.questions(id) on delete cascade,
  instructor_answer text not null
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  selected_choice_id uuid references public.question_choices(id),
  answer_text text,
  is_correct boolean,
  score numeric,
  graded_by uuid references public.users(id),
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (question_id, user_id)
);

-- Auto-grade MCQ the instant a student submits (Mode A requirement)
create or replace function public.auto_grade_mcq()
returns trigger
language plpgsql
as $$
begin
  if new.selected_choice_id is not null then
    select is_correct into new.is_correct
    from public.question_choices
    where id = new.selected_choice_id;
    new.score := case when new.is_correct then 100 else 0 end;
  end if;
  return new;
end;
$$;

create trigger trg_auto_grade_mcq
before insert on public.submissions
for each row execute function public.auto_grade_mcq();

-- ---------- CHAT ----------

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('global','dm')),
  course_id uuid references public.courses(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.channel_members (
  channel_id uuid references public.channels(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  primary key (channel_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  content text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.access_codes enable row level security;
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.books enable row level security;
alter table public.subject_tags enable row level security;
alter table public.book_tags enable row level security;
alter table public.questions enable row level security;
alter table public.question_choices enable row level security;
alter table public.answer_keys enable row level security;
alter table public.submissions enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;

create policy "users read own row" on public.users
  for select using (auth.uid() = id);
create policy "staff read all users" on public.users
  for select using (public.current_user_role() in ('admin','instructor'));
create policy "users update own row" on public.users
  for update using (auth.uid() = id);

create policy "staff manage access codes" on public.access_codes
  for all using (public.current_user_role() in ('admin','instructor'));

create policy "signed-in read courses" on public.courses
  for select using (auth.uid() is not null);
create policy "staff write courses" on public.courses
  for insert with check (public.current_user_role() in ('admin','instructor'));
create policy "staff update courses" on public.courses
  for update using (public.current_user_role() in ('admin','instructor'));

create policy "signed-in read modules" on public.modules
  for select using (auth.uid() is not null);
create policy "staff write modules" on public.modules
  for all using (public.current_user_role() in ('admin','instructor'));

create policy "signed-in read lessons" on public.lessons
  for select using (auth.uid() is not null);
create policy "staff write lessons" on public.lessons
  for all using (public.current_user_role() in ('admin','instructor'));

create policy "signed-in read books" on public.books
  for select using (auth.uid() is not null);
create policy "staff write books" on public.books
  for all using (public.current_user_role() in ('admin','instructor'));

create policy "signed-in read tags" on public.subject_tags
  for select using (auth.uid() is not null);
create policy "staff write tags" on public.subject_tags
  for all using (public.current_user_role() in ('admin','instructor'));

create policy "signed-in read book_tags" on public.book_tags
  for select using (auth.uid() is not null);
create policy "staff write book_tags" on public.book_tags
  for all using (public.current_user_role() in ('admin','instructor'));

create policy "signed-in read questions" on public.questions
  for select using (auth.uid() is not null);
create policy "staff write questions" on public.questions
  for all using (public.current_user_role() in ('admin','instructor'));

create policy "signed-in read choices" on public.question_choices
  for select using (auth.uid() is not null);
create policy "staff write choices" on public.question_choices
  for all using (public.current_user_role() in ('admin','instructor'));

-- ANSWER KEYS: staff only, at the database layer — this is the enforcement point
create policy "staff only read answer keys" on public.answer_keys
  for select using (public.current_user_role() in ('admin','instructor'));
create policy "staff write answer keys" on public.answer_keys
  for all using (public.current_user_role() in ('admin','instructor'));

create policy "students read own submissions" on public.submissions
  for select using (auth.uid() = user_id);
create policy "students insert own submissions" on public.submissions
  for insert with check (auth.uid() = user_id);
create policy "staff read all submissions" on public.submissions
  for select using (public.current_user_role() in ('admin','instructor'));
create policy "staff grade submissions" on public.submissions
  for update using (public.current_user_role() in ('admin','instructor'));

create policy "members read their channels" on public.channels
  for select using (
    type = 'global'
    or exists (select 1 from public.channel_members m where m.channel_id = channels.id and m.user_id = auth.uid())
  );

create policy "members read their membership rows" on public.channel_members
  for select using (auth.uid() = user_id);

create policy "members read channel messages" on public.messages
  for select using (
    exists (
      select 1 from public.channels c
      where c.id = messages.channel_id
      and (c.type = 'global' or exists (select 1 from public.channel_members m where m.channel_id = c.id and m.user_id = auth.uid()))
    )
  );

create policy "members send channel messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.channels c
      where c.id = messages.channel_id
      and (c.type = 'global' or exists (select 1 from public.channel_members m where m.channel_id = c.id and m.user_id = auth.uid()))
    )
  );
