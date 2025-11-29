-- Results table
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  contest_id UUID REFERENCES contests(id),
  game_id TEXT,
  score INTEGER,
  time_taken INTEGER, -- in milliseconds
  answers JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);