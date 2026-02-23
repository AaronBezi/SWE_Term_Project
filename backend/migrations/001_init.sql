-- =============================================================
-- 001_init.sql — Caissa initial schema
-- =============================================================

-- -------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  order_index int NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id serial PRIMARY KEY,
  module_id int NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  order_index int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id int NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- -------------------------------------------------------------
-- Trigger: auto-insert into public.users on signup
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users(id, role, created_at)
  VALUES (NEW.id, 'learner', now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- user_progress: users can only access their own rows
CREATE POLICY user_progress_own_rows ON public.user_progress
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------
-- Helper: is_admin()
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (
    (auth.jwt() ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;

-- -------------------------------------------------------------
-- RLS policies: users
-- -------------------------------------------------------------

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY users_update_self ON public.users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY users_admin_all ON public.users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -------------------------------------------------------------
-- RLS policies: modules
-- -------------------------------------------------------------

CREATE POLICY modules_public_read ON public.modules
  FOR SELECT TO public
  USING (true);

CREATE POLICY modules_admin_manage ON public.modules
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -------------------------------------------------------------
-- RLS policies: lessons
-- -------------------------------------------------------------

CREATE POLICY lessons_public_read ON public.lessons
  FOR SELECT TO public
  USING (true);

CREATE POLICY lessons_admin_manage ON public.lessons
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -------------------------------------------------------------
-- Seed data
-- -------------------------------------------------------------

INSERT INTO public.modules (title, description, order_index)
VALUES
  ('Fundamentals', 'Basics of chess: pieces, moves, rules', 1),
  ('Tactics',      'Common tactical motifs and puzzles',    2),
  ('Endgames',     'Basic endgame principles and techniques', 3)
ON CONFLICT (order_index) DO NOTHING;

WITH m AS (
  SELECT id, title FROM public.modules WHERE title IN ('Fundamentals', 'Tactics', 'Endgames')
)
INSERT INTO public.lessons (module_id, title, content, order_index)
VALUES
  ((SELECT id FROM m WHERE title = 'Fundamentals'), 'Pieces and Moves',  'Overview of pieces and legal moves',   1),
  ((SELECT id FROM m WHERE title = 'Fundamentals'), 'Basic Checkmates',  'Mate-in-1 and simple checkmates',       2),
  ((SELECT id FROM m WHERE title = 'Tactics'),      'Pins and Skewers',  'How pins and skewers work',             1),
  ((SELECT id FROM m WHERE title = 'Tactics'),      'Forks',             'Using forks to win material',           2),
  ((SELECT id FROM m WHERE title = 'Endgames'),     'King and Pawn',     'Basic king and pawn endgames',          1),
  ((SELECT id FROM m WHERE title = 'Endgames'),     'Opposition',        'Understanding opposition',              2)
ON CONFLICT (module_id, order_index) DO NOTHING;

-- -------------------------------------------------------------
-- Index
-- -------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);

-- -------------------------------------------------------------
-- Helper function: get_user_next_lessons(p_user_id)
-- Returns each module's next unfinished lesson and whether it is unlocked.
-- Handles non-contiguous order_index values.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_next_lessons(p_user_id uuid)
RETURNS TABLE (
  module_id        int,
  module_title     text,
  next_lesson_id   int,
  next_lesson_title text,
  is_unlocked      boolean
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH last_completed AS (
    SELECT l.module_id, MAX(l.order_index) AS max_completed_index
    FROM public.user_progress up
    JOIN public.lessons l ON up.lesson_id = l.id
    WHERE up.user_id = p_user_id
    GROUP BY l.module_id
  ),
  next_per_module AS (
    SELECT
      m.id    AS module_id,
      m.title AS module_title,
      (
        SELECT l.id
        FROM public.lessons l
        WHERE l.module_id = m.id
          AND l.order_index > COALESCE(lc.max_completed_index, 0)
        ORDER BY l.order_index ASC
        LIMIT 1
      ) AS next_lesson_id
    FROM public.modules m
    LEFT JOIN last_completed lc ON lc.module_id = m.id
  )
  SELECT
    npm.module_id,
    npm.module_title,
    nl.id    AS next_lesson_id,
    nl.title AS next_lesson_title,
    CASE
      WHEN nl.id IS NULL THEN false
      ELSE (nl.order_index <= COALESCE(lc.max_completed_index, 0) + 1)
    END AS is_unlocked
  FROM next_per_module npm
  LEFT JOIN public.lessons     nl ON nl.id       = npm.next_lesson_id
  LEFT JOIN last_completed     lc ON lc.module_id = npm.module_id
  ORDER BY (SELECT order_index FROM public.modules WHERE id = npm.module_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_next_lessons(uuid) FROM anon, authenticated;

-- -------------------------------------------------------------
-- Convenience view: current_user_next_lessons
-- Authenticated users can query this directly without passing their UUID.
-- -------------------------------------------------------------

CREATE OR REPLACE VIEW public.current_user_next_lessons
WITH (security_invoker = on) AS
SELECT * FROM public.get_user_next_lessons((SELECT auth.uid()));
