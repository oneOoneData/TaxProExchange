-- Mark all existing events as pending review for admin checking
-- This allows the admin to review all current events through the admin interface

-- Update all existing events to pending_review status
UPDATE events 
SET 
  review_status = 'pending_review',
  reviewed_at = NULL,
  reviewed_by = NULL,
  admin_notes = NULL
WHERE review_status IS NULL 
   OR review_status != 'pending_review';

-- Show the results
SELECT 
  review_status,
  COUNT(*) as event_count
FROM events 
GROUP BY review_status
ORDER BY review_status;

-- Show some sample events for verification
SELECT 
  id,
  title,
  start_date,
  review_status,
  link_health_score,
  candidate_url
FROM events 
WHERE review_status = 'pending_review'
ORDER BY start_date
LIMIT 10;
