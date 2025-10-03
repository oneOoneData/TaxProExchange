-- Add mentoring_message, software, and specializations fields to mentorship_preferences table
ALTER TABLE mentorship_preferences 
ADD COLUMN IF NOT EXISTS mentoring_message TEXT,
ADD COLUMN IF NOT EXISTS software TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentorship_message_gin ON mentorship_preferences USING gin (to_tsvector('english', mentoring_message));
CREATE INDEX IF NOT EXISTS idx_mentorship_software_gin ON mentorship_preferences USING gin (software);
CREATE INDEX IF NOT EXISTS idx_mentorship_specializations_gin ON mentorship_preferences USING gin (specializations);