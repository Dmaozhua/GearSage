CREATE TABLE IF NOT EXISTS gear_feedback (
  id BIGSERIAL PRIMARY KEY,
  "userId" BIGINT NOT NULL,
  "gearType" VARCHAR(16) NOT NULL,
  "masterId" VARCHAR(64) NOT NULL,
  "variantId" VARCHAR(128) NOT NULL DEFAULT '',
  "fieldKey" VARCHAR(128) NOT NULL DEFAULT '',
  "fieldLabel" VARCHAR(128) NOT NULL DEFAULT '',
  "feedbackType" VARCHAR(32) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  contact VARCHAR(128) NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  "handledByAdminId" BIGINT,
  "handledRemark" TEXT NOT NULL DEFAULT '',
  "handledAt" TIMESTAMPTZ,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_feedback_status
ON gear_feedback (status, "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_gear_feedback_gear
ON gear_feedback ("gearType", "masterId", "variantId");

CREATE INDEX IF NOT EXISTS idx_gear_feedback_user
ON gear_feedback ("userId", "createTime" DESC);
