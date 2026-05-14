CREATE TABLE IF NOT EXISTS gear_selection_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  gear_category VARCHAR(32) NOT NULL DEFAULT '',
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(32) NOT NULL DEFAULT '',
  created_topic_id BIGINT,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_selection_sessions_user_id
ON gear_selection_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_gear_selection_sessions_gear_category
ON gear_selection_sessions (gear_category);

CREATE INDEX IF NOT EXISTS idx_gear_selection_sessions_created_topic_id
ON gear_selection_sessions (created_topic_id);
