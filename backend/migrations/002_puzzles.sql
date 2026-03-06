-- =============================================================
-- 002_puzzles.sql — Add puzzles table (Supabase / production)
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

ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;

-- Any visitor can read puzzles (same as modules/lessons)
CREATE POLICY puzzles_public_read ON public.puzzles
  FOR SELECT TO public
  USING (true);

-- Only admins can insert, update, or delete puzzles
CREATE POLICY puzzles_admin_manage ON public.puzzles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
