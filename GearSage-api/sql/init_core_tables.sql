CREATE TABLE IF NOT EXISTS bz_mini_user (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(32) UNIQUE,
  "nickName" VARCHAR(100) NOT NULL DEFAULT '',
  "avatarUrl" TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  background TEXT NOT NULL DEFAULT '',
  "shipAddress" TEXT NOT NULL DEFAULT '',
  status INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
  "inviteCode" VARCHAR(50) NOT NULL DEFAULT '',
  "invitedByUserId" BIGINT,
  "inviteSuccessCount" INT NOT NULL DEFAULT 0,
  "inviteRewardPoints" INT NOT NULL DEFAULT 0,
  "inviteRewardCount" INT NOT NULL DEFAULT 0,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bz_mini_topic (
  id BIGSERIAL PRIMARY KEY,
  "topicCategory" INT NOT NULL DEFAULT 0,
  title VARCHAR(255) NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  status INT NOT NULL DEFAULT 0,
  "userId" BIGINT NOT NULL,
  "publishTime" TIMESTAMPTZ,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "likeCount" INT NOT NULL DEFAULT 0,
  "commentCount" INT NOT NULL DEFAULT 0,
  "isDelete" INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bz_topic_comment (
  id BIGSERIAL PRIMARY KEY,
  "topicId" BIGINT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  "replyCommentId" BIGINT,
  "replyUserId" BIGINT,
  "userId" BIGINT NOT NULL,
  status INT NOT NULL DEFAULT 2,
  "isVisible" INT NOT NULL DEFAULT 1,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bz_topic_like (
  id BIGSERIAL PRIMARY KEY,
  "topicId" BIGINT NOT NULL,
  "userId" BIGINT NOT NULL,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("topicId", "userId")
);

CREATE TABLE IF NOT EXISTS bz_topic_comment_like (
  id BIGSERIAL PRIMARY KEY,
  "commentId" BIGINT NOT NULL,
  "userId" BIGINT NOT NULL,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("commentId", "userId")
);

DELETE FROM bz_topic_comment_like a
USING bz_topic_comment_like b
WHERE a.id < b.id
  AND a."commentId" = b."commentId"
  AND a."userId" = b."userId";

CREATE TABLE IF NOT EXISTS auth_identities (
  id BIGSERIAL PRIMARY KEY,
  "userId" BIGINT NOT NULL,
  "identityType" VARCHAR(32) NOT NULL,
  "identityValue" VARCHAR(128) NOT NULL,
  "verifiedAt" TIMESTAMPTZ,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("identityType", "identityValue")
);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  "userId" BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGSERIAL PRIMARY KEY,
  "userId" BIGINT,
  "bizType" VARCHAR(32) NOT NULL,
  "bizId" VARCHAR(64) NOT NULL DEFAULT '',
  "fileName" VARCHAR(255) NOT NULL,
  "fileExt" VARCHAR(32) NOT NULL DEFAULT '',
  "mimeType" VARCHAR(100) NOT NULL DEFAULT '',
  "fileSize" BIGINT NOT NULL DEFAULT 0,
  "objectKey" TEXT NOT NULL,
  url TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  "moderationStatus" VARCHAR(16) NOT NULL DEFAULT 'pass',
  "moderationProvider" VARCHAR(32) NOT NULL DEFAULT '',
  "moderationRiskLevel" VARCHAR(64) NOT NULL DEFAULT '',
  "moderationReason" TEXT NOT NULL DEFAULT '',
  "moderationRaw" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "moderatedAt" TIMESTAMPTZ,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  status INT NOT NULL DEFAULT 0,
  role VARCHAR(32) NOT NULL DEFAULT 'super_admin',
  "lastLoginAt" TIMESTAMPTZ,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id BIGSERIAL PRIMARY KEY,
  "adminUserId" BIGINT NOT NULL,
  "targetType" VARCHAR(32) NOT NULL,
  "targetId" VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  remark TEXT NOT NULL DEFAULT '',
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_records (
  id BIGSERIAL PRIMARY KEY,
  scene VARCHAR(64) NOT NULL,
  "targetType" VARCHAR(32) NOT NULL DEFAULT '',
  "targetId" VARCHAR(64) NOT NULL DEFAULT '',
  "contentType" VARCHAR(16) NOT NULL DEFAULT 'text',
  provider VARCHAR(32) NOT NULL DEFAULT '',
  result VARCHAR(16) NOT NULL DEFAULT 'pass',
  "riskLevel" VARCHAR(64) NOT NULL DEFAULT '',
  "riskReason" TEXT NOT NULL DEFAULT '',
  "hitLabels" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "requestId" VARCHAR(128) NOT NULL DEFAULT '',
  "rawResultJson" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "operatorType" VARCHAR(16) NOT NULL DEFAULT 'system',
  "operatorId" VARCHAR(64) NOT NULL DEFAULT '',
  "userId" BIGINT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_type VARCHAR(32) NOT NULL DEFAULT 'text',
  match_type VARCHAR(32) NOT NULL DEFAULT 'contains',
  keyword VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  remark TEXT NOT NULL DEFAULT '',
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bz_tag_definitions (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'fun',
  sub_type VARCHAR(64) NOT NULL DEFAULT '',
  rarity_level INT NOT NULL DEFAULT 1,
  style_key VARCHAR(64) NOT NULL DEFAULT '',
  icon_key VARCHAR(64) NOT NULL DEFAULT '',
  source_type VARCHAR(32) NOT NULL DEFAULT 'system',
  is_redeemable BOOLEAN NOT NULL DEFAULT FALSE,
  is_wearable BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_priority INT NOT NULL DEFAULT 0,
  credibility_weight INT NOT NULL DEFAULT 0,
  is_authoritative BOOLEAN NOT NULL DEFAULT FALSE,
  scene_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bz_user_tags (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  tag_id VARCHAR(64) NOT NULL,
  obtain_method VARCHAR(32) NOT NULL DEFAULT 'system',
  obtain_source_id VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tag_id)
);

CREATE TABLE IF NOT EXISTS user_tag_display_settings (
  user_id BIGINT PRIMARY KEY,
  main_tag_id VARCHAR(64),
  equipped_tag_id VARCHAR(64),
  display_strategy VARCHAR(16) NOT NULL DEFAULT 'smart',
  post_tag_mode VARCHAR(16) NOT NULL DEFAULT 'smart',
  custom_post_tags JSONB NOT NULL DEFAULT '{}'::jsonb,
  prefer_identity_in_review BOOLEAN NOT NULL DEFAULT FALSE,
  prefer_fun_in_catch BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bz_points_goods (
  id VARCHAR(64) PRIMARY KEY,
  type INT NOT NULL DEFAULT 0,
  tag_id VARCHAR(64),
  goods_name VARCHAR(100) NOT NULL DEFAULT '',
  points INT NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  rules TEXT NOT NULL DEFAULT '',
  rarity_level INT NOT NULL DEFAULT 1,
  stock INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bz_mini_task_feat (
  id VARCHAR(64) PRIMARY KEY,
  type INT NOT NULL DEFAULT 0,
  action_type VARCHAR(64) NOT NULL DEFAULT '',
  name VARCHAR(100) NOT NULL DEFAULT '',
  task_feat_desc TEXT NOT NULL DEFAULT '',
  points INT NOT NULL DEFAULT 0,
  target_count INT NOT NULL DEFAULT 1,
  sort INT NOT NULL DEFAULT 0,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bz_mini_task_feat_record (
  id BIGSERIAL PRIMARY KEY,
  "userId" BIGINT NOT NULL,
  "taskFeatId" VARCHAR(64) NOT NULL,
  "taskFeatName" VARCHAR(100) NOT NULL DEFAULT '',
  points INT NOT NULL DEFAULT 0,
  received BOOLEAN NOT NULL DEFAULT FALSE,
  "taskFeatDesc" TEXT NOT NULL DEFAULT '',
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gear_brands (
  id BIGINT PRIMARY KEY,
  name VARCHAR(128) NOT NULL DEFAULT '',
  name_en VARCHAR(128) NOT NULL DEFAULT '',
  name_jp VARCHAR(128) NOT NULL DEFAULT '',
  name_zh VARCHAR(128) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  site_url TEXT NOT NULL DEFAULT '',
  raw_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gear_master (
  kind VARCHAR(16) NOT NULL,
  id BIGINT NOT NULL,
  "brandId" BIGINT,
  model VARCHAR(128) NOT NULL DEFAULT '',
  "modelCn" VARCHAR(128) NOT NULL DEFAULT '',
  "modelYear" VARCHAR(32) NOT NULL DEFAULT '',
  type VARCHAR(64) NOT NULL DEFAULT '',
  system VARCHAR(64) NOT NULL DEFAULT '',
  "waterColumn" VARCHAR(64) NOT NULL DEFAULT '',
  action VARCHAR(64) NOT NULL DEFAULT '',
  alias VARCHAR(255) NOT NULL DEFAULT '',
  "typeTips" VARCHAR(255) NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (kind, id)
);

CREATE TABLE IF NOT EXISTS gear_variants (
  kind VARCHAR(16) NOT NULL,
  "sourceKey" VARCHAR(64) NOT NULL,
  "gearId" BIGINT NOT NULL,
  "variantId" BIGINT NOT NULL,
  sku VARCHAR(255) NOT NULL DEFAULT '',
  raw_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updateTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (kind, "sourceKey", "variantId")
);

ALTER TABLE bz_mini_user
  ADD COLUMN IF NOT EXISTS phone VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE bz_mini_topic
  ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE bz_topic_comment
  ADD COLUMN IF NOT EXISTS status INT NOT NULL DEFAULT 2;

UPDATE bz_topic_comment
SET status = CASE WHEN "isVisible" = 1 THEN 2 ELSE 9 END
WHERE ("isVisible" = 0 AND status = 2);

ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS "moderationStatus" VARCHAR(16) NOT NULL DEFAULT 'pass',
  ADD COLUMN IF NOT EXISTS "moderationProvider" VARCHAR(32) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "moderationRiskLevel" VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "moderationReason" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "moderationRaw" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bz_mini_topic_list
ON bz_mini_topic ("topicCategory", status, "isDelete", "publishTime" DESC);

CREATE INDEX IF NOT EXISTS idx_bz_mini_topic_user
ON bz_mini_topic ("userId", status, "isDelete", "updateTime" DESC);

CREATE INDEX IF NOT EXISTS idx_bz_mini_user_phone
ON bz_mini_user (phone);

CREATE INDEX IF NOT EXISTS idx_bz_topic_comment_topic
ON bz_topic_comment ("topicId", "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_bz_topic_like_topic
ON bz_topic_like ("topicId");

CREATE INDEX IF NOT EXISTS idx_bz_topic_like_user
ON bz_topic_like ("userId");

CREATE INDEX IF NOT EXISTS idx_bz_topic_comment_like_comment
ON bz_topic_comment_like ("commentId");

CREATE INDEX IF NOT EXISTS idx_bz_topic_comment_like_user
ON bz_topic_comment_like ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS uq_bz_topic_comment_like_comment_user
ON bz_topic_comment_like ("commentId", "userId");

CREATE INDEX IF NOT EXISTS idx_auth_identities_user
ON auth_identities ("userId");

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user
ON auth_refresh_tokens ("userId", "expiresAt");

CREATE INDEX IF NOT EXISTS idx_media_assets_user
ON media_assets ("userId", "bizType", "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_media_assets_moderation
ON media_assets ("moderationStatus", "bizType", "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_admin_users_status
ON admin_users (status, username);

CREATE INDEX IF NOT EXISTS idx_admin_logs_target
ON admin_operation_logs ("targetType", "targetId", "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin
ON admin_operation_logs ("adminUserId", "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_records_target
ON moderation_records ("targetType", "targetId", "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_records_result
ON moderation_records (result, scene, "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_rules_active
ON moderation_rules (status, rule_type, "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_bz_tag_definitions_active
ON bz_tag_definitions (is_active, is_redeemable, is_wearable, display_priority DESC);

CREATE INDEX IF NOT EXISTS idx_bz_user_tags_user
ON bz_user_tags (user_id, status, obtained_at DESC);

CREATE INDEX IF NOT EXISTS idx_bz_user_tags_tag
ON bz_user_tags (tag_id, status);

CREATE INDEX IF NOT EXISTS idx_user_tag_display_settings_main
ON user_tag_display_settings (main_tag_id);

CREATE INDEX IF NOT EXISTS idx_bz_points_goods_type
ON bz_points_goods (type, is_available, points ASC);

CREATE INDEX IF NOT EXISTS idx_bz_mini_task_feat_type
ON bz_mini_task_feat (type, sort ASC);

CREATE INDEX IF NOT EXISTS idx_bz_mini_task_feat_record_user
ON bz_mini_task_feat_record ("userId", "createTime" DESC);

CREATE INDEX IF NOT EXISTS idx_bz_mini_task_feat_record_task
ON bz_mini_task_feat_record ("taskFeatId", "userId");

CREATE INDEX IF NOT EXISTS idx_gear_brands_name
ON gear_brands (name);

CREATE INDEX IF NOT EXISTS idx_gear_master_kind_brand
ON gear_master (kind, "brandId");

CREATE INDEX IF NOT EXISTS idx_gear_master_kind_model
ON gear_master (kind, model, "modelCn");

CREATE INDEX IF NOT EXISTS idx_gear_variants_lookup
ON gear_variants (kind, "gearId");
