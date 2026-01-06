-- Migration: Add Google OAuth support to users table
-- Date: 2026-01-06
-- Description: Adds OAuth fields and makes password nullable for social login

-- Add new columns for OAuth support
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "firstName" VARCHAR,
ADD COLUMN IF NOT EXISTS "lastName" VARCHAR,
ADD COLUMN IF NOT EXISTS "picture" VARCHAR,
ADD COLUMN IF NOT EXISTS "provider" VARCHAR DEFAULT 'local',
ADD COLUMN IF NOT EXISTS "providerId" VARCHAR;

-- Make password nullable since OAuth users won't have passwords
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Add composite index for faster OAuth user lookups
CREATE INDEX IF NOT EXISTS idx_users_provider_provider_id 
ON users(provider, "providerId") 
WHERE provider IS NOT NULL AND "providerId" IS NOT NULL;

-- Add index for email lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Update existing users to have 'local' provider
UPDATE users 
SET provider = 'local' 
WHERE provider IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.provider IS 'Authentication provider: local, google';
COMMENT ON COLUMN users."providerId" IS 'Unique identifier from OAuth provider';
