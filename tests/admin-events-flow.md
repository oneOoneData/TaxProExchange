# Admin Events Flow Test Guide

## Step-by-Step Testing Process

### 1. Clear Existing Events (Optional)
Run the SQL script to clear existing events:
```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f database/clear_existing_events.sql
```

Or use the admin interface:
1. Go to `/admin`
2. Click "Clear All Events" button
3. Confirm the action

### 2. Apply Database Migration
```bash
# Run the link health migration
supabase migration up
```

### 3. Test Admin Refresh Button
1. Navigate to `/admin` page
2. You should see:
   - **Total events in database**: 0
   - **Verified & publishable events**: 0
   - **Validation rate**: N/A

3. Click "Refresh Events (AI + Link Validation)" button
4. Wait for the process to complete (may take 1-2 minutes)
5. You should see detailed results like:
   ```
   ✅ Success! AI fetched 25 events

   📥 Ingestion Results:
     • Processed: 25
     • Inserted: 20
     • Updated: 5
     • Errors: 0

   🔍 Link Validation Results:
     • Processed: 25
     • Validated: 23
     • Publishable: 18
     • Errors: 2
   ```

### 4. Verify Event Counts
After refresh, the admin interface should show:
- **Total events in database**: [total number]
- **Verified & publishable events**: [number with score ≥70]
- **Validation rate**: [percentage of publishable events]

### 5. Test Events API
```bash
# Test that only verified events are returned
curl -X GET "http://localhost:3000/api/events?mode=all&region=CA"
```

Expected response should only include events with `publishable: true`.

### 6. Test Manual Recheck
```bash
# Check validation status
curl -X GET "http://localhost:3000/api/events/recheck"

# Run manual validation batch
curl -X POST "http://localhost:3000/api/events/recheck?batch_size=10"
```

### 7. Verify Link Health Data
Check that events have link health information:
```bash
# Query events table directly to see link health data
SELECT 
  title,
  candidate_url,
  canonical_url,
  link_health_score,
  publishable,
  last_checked_at
FROM events 
ORDER BY created_at DESC 
LIMIT 5;
```

## Expected Results

### ✅ Success Indicators
- Admin button shows detailed ingestion and validation results
- Event counts update correctly after refresh
- Only events with `publishable: true` are returned by API
- Events have `link_health_score` values (0-100)
- Events have `canonical_url` when available
- Events have `last_checked_at` timestamps

### ❌ Failure Indicators
- API returns events with 404 URLs
- No link health data in events table
- Validation rate is 0% (no publishable events)
- Errors in admin button results
- Events API returns all events regardless of validation status

## Troubleshooting

### If No Events Are Publishable
1. Check OpenAI API key is set
2. Verify network connectivity for link checking
3. Check Supabase connection
4. Review validation logs in browser console

### If Validation Fails
1. Check `app/api/events/recheck` endpoint manually
2. Verify link checker utility is working
3. Check for rate limiting on external URLs
4. Review error logs

### If Admin Button Shows Errors
1. Verify admin permissions
2. Check OpenAI API quota
3. Review network connectivity
4. Check Supabase connection

## Performance Notes
- Initial refresh may take 1-2 minutes due to link validation
- Validation runs in batches to avoid overwhelming external servers
- Events are cached for 24 hours before re-validation
- Dead URLs are tombstoned to avoid repeated failures
