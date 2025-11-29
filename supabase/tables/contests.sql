-- Contests table
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL,
  entry_fee DECIMAL(10,2) NOT NULL,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  platform_commission DECIMAL(10,2) DEFAULT 0,
  max_players INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER, -- in minutes
  created_by UUID REFERENCES users(id),
  difficulty TEXT DEFAULT 'beginner',
  is_private BOOLEAN DEFAULT FALSE,
  access_code TEXT,
  status TEXT DEFAULT 'upcoming', -- upcoming, ongoing, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);