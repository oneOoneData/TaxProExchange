# Event Link Health System - Testing Examples

## Manual Event Recheck

### Check validation status
```bash
curl -X GET "http://localhost:3000/api/events/recheck"
```

### Recheck specific event
```bash
curl -X POST "http://localhost:3000/api/events/recheck?id=EVENT_UUID"
```

### Run batch validation
```bash
curl -X POST "http://localhost:3000/api/events/recheck?batch_size=50"
```

## Events API (Only returns verified events)

### Get all verified events
```bash
curl -X GET "http://localhost:3000/api/events?mode=all&region=CA"
```

### Get curated events (requires authentication)
```bash
curl -X GET "http://localhost:3000/api/events?mode=curated&region=CA" \
  -H "Cookie: __session=YOUR_SESSION_COOKIE"
```

## Manual Event Refresh (Admin)

### Refresh events from OpenAI with link validation
```bash
curl -X POST "http://localhost:3000/api/events/refresh" \
  -H "Cookie: __session=YOUR_SESSION_COOKIE"
```

## Expected Response Formats

### Events API Response
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Tax Conference 2025",
      "description": "Annual tax conference...",
      "start_date": "2025-03-15T09:00:00Z",
      "end_date": "2025-03-15T17:00:00Z",
      "location_city": "San Francisco",
      "location_state": "CA",
      "url": "https://example.com/tax-conference",
      "tags": ["general_tax", "conference"],
      "organizer": "Tax Professionals Association",
      "source": "ai_generated",
      "link_health_score": 85,
      "last_checked_at": "2025-01-04T10:30:00Z"
    }
  ]
}
```

### Recheck Response
```json
{
  "success": true,
  "processed": 50,
  "validated": 45,
  "publishable": 40,
  "errors": 5,
  "message": "Validation complete: 45 validated, 40 publishable"
}
```

### Refresh Response
```json
{
  "total": 25,
  "ingestion": {
    "processed": 25,
    "inserted": 15,
    "updated": 10,
    "errors": 0
  },
  "validation": {
    "processed": 50,
    "validated": 45,
    "publishable": 40,
    "errors": 5
  }
}
```

## Testing Checklist

- [ ] Run migration: `supabase migration up`
- [ ] Test events API returns only publishable events
- [ ] Test manual recheck endpoint
- [ ] Test batch validation
- [ ] Verify link health scores are calculated correctly
- [ ] Check that 404 links are not published
- [ ] Verify canonical URLs are extracted
- [ ] Test redirect handling
- [ ] Check tombstone functionality for dead links
