-- Add OAuth columns to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER password,
ADD INDEX idx_google_id (google_id);

-- Optional: Add other OAuth provider columns for future use
-- ALTER TABLE users ADD COLUMN facebook_id VARCHAR(255) NULL UNIQUE AFTER google_id;
-- ALTER TABLE users ADD COLUMN github_id VARCHAR(255) NULL UNIQUE AFTER facebook_id;
