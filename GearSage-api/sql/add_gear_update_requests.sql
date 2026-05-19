CREATE TABLE IF NOT EXISTS gear_update_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  gear_type VARCHAR(16) NOT NULL,
  gear_name VARCHAR(80) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  search_keyword VARCHAR(120) NOT NULL DEFAULT '',
  search_context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_page VARCHAR(64) NOT NULL DEFAULT 'gear_list',
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  moderation_result VARCHAR(16) NOT NULL DEFAULT '',
  moderation_reason TEXT NOT NULL DEFAULT '',
  admin_remark TEXT NOT NULL DEFAULT '',
  handled_by_admin_id BIGINT,
  handled_at TIMESTAMPTZ,
  request_day DATE NOT NULL,
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ux_gear_update_requests_user_day UNIQUE (user_id, request_day),
  CONSTRAINT ck_gear_update_requests_type CHECK (gear_type IN ('reels', 'rods', 'lures', 'other')),
  CONSTRAINT ck_gear_update_requests_status CHECK (status IN ('pending', 'review', 'accepted', 'ignored', 'done'))
);

CREATE INDEX IF NOT EXISTS idx_gear_update_requests_status
ON gear_update_requests (status, create_time DESC);

CREATE INDEX IF NOT EXISTS idx_gear_update_requests_type
ON gear_update_requests (gear_type, create_time DESC);

CREATE INDEX IF NOT EXISTS idx_gear_update_requests_user
ON gear_update_requests (user_id, create_time DESC);
