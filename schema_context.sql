-- context_notes table
-- Stores Memory tab notes (replaces File System Access API / IndexedDB)
-- Run once in Supabase SQL editor or via MCP apply_migration

CREATE TABLE IF NOT EXISTS context_notes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL DEFAULT 'memory',
  project    text        CHECK (project IN ('hedging-tool','customer-portal','design','other') OR project IS NULL),
  category   text,
  title      text        NOT NULL,
  body       text,
  pinned     boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE context_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own context notes"
  ON context_notes
  FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_context_notes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_context_notes_updated_at
  BEFORE UPDATE ON context_notes
  FOR EACH ROW EXECUTE FUNCTION update_context_notes_updated_at();
