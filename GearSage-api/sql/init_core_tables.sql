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

ALTER TABLE bz_mini_user
  ADD COLUMN IF NOT EXISTS phone VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE bz_mini_topic
  ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;

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
