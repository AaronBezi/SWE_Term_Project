-- =============================================================
-- 001_init_local.sql — Caissa local development schema
-- =============================================================
-- This file is for running against your LOCAL PostgreSQL instance.
-- It mirrors the production schema (001_init.sql) but removes everything
-- that is specific to Supabase, which does not exist locally:
--
--   - No reference to auth.users (Supabase-only table)
--   - No auth.uid() / auth.jwt() RLS policies (Supabase-only functions)
--   - No trigger on auth.users for auto user creation
--
-- Authentication is handled by the Express middleware, not the database.
-- =============================================================


-- -------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------

-- Stores registered users.
-- In production this table's id is a FK to Supabase's auth.users.
-- Locally it is a standalone table with a UUID primary key.
CREATE TABLE IF NOT EXISTS public.users (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  role       text    NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Top-level groupings of lessons (e.g. "Fundamentals", "Tactics").
-- order_index determines the sequence in which modules appear in the course.
CREATE TABLE IF NOT EXISTS public.modules (
  id          serial  PRIMARY KEY,
  title       text    NOT NULL,
  description text,
  order_index int     NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Individual lessons that belong to a module.
-- order_index determines the sequence within a module.
CREATE TABLE IF NOT EXISTS public.lessons (
  id          serial  PRIMARY KEY,
  module_id   int     NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title       text    NOT NULL,
  content     text,
  order_index int     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, order_index)  -- no two lessons can share a position within a module
);

-- Tracks which lessons each user has completed and when.
-- user_id is a UUID matching the Supabase auth user's id (from the JWT).
-- Note: no FK to public.users locally (users are auto-created on first request).
CREATE TABLE IF NOT EXISTS public.user_progress (
  id           serial  PRIMARY KEY,
  user_id      uuid    NOT NULL,
  lesson_id    int     NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)  -- a user can only complete a lesson once
);


-- -------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------

-- Speed up lookups like "give me all lessons for module 2"
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);


-- -------------------------------------------------------------
-- Seed data — 3 modules, 2 lessons each
-- -------------------------------------------------------------

INSERT INTO public.modules (title, description, order_index)
VALUES
  ('Fundamentals', 'Basics of chess: pieces, moves, rules',      1),
  ('Tactics',      'Common tactical motifs and puzzles',          2),
  ('Endgames',     'Basic endgame principles and techniques',     3)
ON CONFLICT (order_index) DO NOTHING;

-- Use a CTE to look up module IDs by title so we do not hard-code serial IDs
WITH m AS (
  SELECT id, title FROM public.modules
  WHERE title IN ('Fundamentals', 'Tactics', 'Endgames')
)
INSERT INTO public.lessons (module_id, title, content, order_index)
VALUES
  ((SELECT id FROM m WHERE title = 'Fundamentals'), 'Pieces and Moves', 'Overview of pieces and legal moves', 1),
  ((SELECT id FROM m WHERE title = 'Fundamentals'), 'Basic Checkmates',  'Mate-in-1 and simple checkmates',    2),
  ((SELECT id FROM m WHERE title = 'Tactics'),      'Pins and Skewers',  'How pins and skewers work',          1),
  ((SELECT id FROM m WHERE title = 'Tactics'),      'Forks',             'Using forks to win material',        2),
  ((SELECT id FROM m WHERE title = 'Endgames'),     'King and Pawn',     'Basic king and pawn endgames',       1),
  ((SELECT id FROM m WHERE title = 'Endgames'),     'Opposition',        'Understanding opposition',           2)
ON CONFLICT (module_id, order_index) DO NOTHING;
