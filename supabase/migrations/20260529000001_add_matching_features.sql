-- Add matching opt-in and connection credits to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS allow_matching boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS connection_credits_remaining integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS connection_credits_used integer NOT NULL DEFAULT 0;

-- Create match config table (Koen can edit these values)
CREATE TABLE IF NOT EXISTS match_config (
  id integer PRIMARY KEY DEFAULT 1,
  rules jsonb NOT NULL DEFAULT '[
    {"signal": "same_city", "weight": 30, "enabled": true},
    {"signal": "same_state", "weight": 15, "enabled": true},
    {"signal": "remote_ok", "weight": 10, "enabled": true},
    {"signal": "complementary_skill", "weight": 25, "enabled": true},
    {"signal": "niche_scarcity", "weight": 20, "enabled": true},
    {"signal": "same_experience_level", "weight": 10, "enabled": true}
  ]',
  min_score integer NOT NULL DEFAULT 30,
  max_suggestions integer NOT NULL DEFAULT 5,
  free_credits integer NOT NULL DEFAULT 6,
  rotation_days integer NOT NULL DEFAULT 7,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the config
INSERT INTO match_config (id, rules, min_score, max_suggestions, free_credits, rotation_days)
VALUES (1, '[
    {"signal": "same_city", "weight": 30, "enabled": true},
    {"signal": "same_state", "weight": 15, "enabled": true},
    {"signal": "remote_ok", "weight": 10, "enabled": true},
    {"signal": "complementary_skill", "weight": 25, "enabled": true},
    {"signal": "niche_scarcity", "weight": 20, "enabled": true},
    {"signal": "same_experience_level", "weight": 10, "enabled": true}
  ]', 30, 5, 6, 7)
ON CONFLICT (id) DO NOTHING;

-- Track which matches have been shown to avoid repeats
CREATE TABLE IF NOT EXISTS match_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suggested_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score integer NOT NULL,
  was_shown boolean NOT NULL DEFAULT false,
  was_clicked boolean NOT NULL DEFAULT false,
  was_connected boolean NOT NULL DEFAULT false,
  shown_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(viewer_profile_id, suggested_profile_id)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_match_history_viewer ON match_history(viewer_profile_id, was_shown);
CREATE INDEX IF NOT EXISTS idx_match_history_suggested ON match_history(suggested_profile_id);
