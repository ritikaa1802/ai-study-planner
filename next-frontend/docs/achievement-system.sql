-- Achievement system schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS achievement_definitions (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  points INTEGER NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  progress_value INTEGER NOT NULL DEFAULT 0,
  level_unlocked INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Initial achievement definitions
INSERT INTO achievement_definitions (key, name, description, category, threshold, points, level, is_hidden)
VALUES
  ('FIRST_TASK', 'First Task', 'Complete your first task.', 'productivity', 1, 10, 1, FALSE),
  ('TASK_STARTER', 'Task Starter', 'Complete 5 tasks.', 'productivity', 5, 25, 1, FALSE),
  ('TASK_MASTER', 'Task Master', 'Complete 20 tasks.', 'productivity', 20, 50, 2, FALSE),

  ('STREAK_3', '3-Day Streak', 'Maintain a 3 day streak.', 'consistency', 3, 10, 1, FALSE),
  ('STREAK_7', '7-Day Streak', 'Maintain a 7 day streak.', 'consistency', 7, 25, 2, FALSE),

  ('FOCUS_BEGINNER', 'Focus Beginner', 'Complete 5 focus sessions.', 'focus', 5, 10, 1, FALSE),
  ('FOCUS_PRO', 'Focus Pro', 'Complete 15 focus sessions.', 'focus', 15, 25, 2, FALSE),

  ('GOAL_ACHIEVER', 'Goal Achiever', 'Complete 1 goal.', 'goals', 1, 25, 1, FALSE),
  ('GOAL_CRUSHER', 'Goal Crusher', 'Complete 3 goals.', 'goals', 3, 50, 2, FALSE),

  ('STUDY_2_HOURS', '2 Hours Studied', 'Study for 120 total minutes.', 'time', 120, 10, 1, FALSE),
  ('STUDY_10_HOURS', '10 Hours Studied', 'Study for 600 total minutes.', 'time', 600, 50, 3, FALSE)
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  threshold = EXCLUDED.threshold,
  points = EXCLUDED.points,
  level = EXCLUDED.level,
  is_hidden = EXCLUDED.is_hidden;
