ALTER TABLE gear_master
  ADD COLUMN IF NOT EXISTS "pronunciationAudioUrl" TEXT NOT NULL DEFAULT '';
