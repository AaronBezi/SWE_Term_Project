-- =============================================================
-- 002_puzzles_local.sql — Add puzzles table (local dev)
-- =============================================================
-- Mirrors 002_puzzles.sql but omits Supabase-only RLS policies
-- since auth.uid() / auth.jwt() are not available locally.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.puzzles (
  id          serial  PRIMARY KEY,
  lesson_id   int     NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  lichess_id  text    NOT NULL UNIQUE,
  fen         text    NOT NULL,
  moves       text    NOT NULL,
  rating      int     NOT NULL,
  skill_level text    NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  themes      text    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_puzzles_lesson_id ON public.puzzles(lesson_id);
