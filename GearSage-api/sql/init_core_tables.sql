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
