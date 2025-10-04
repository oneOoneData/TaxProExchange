# API Testing Examples

## Slack Integration API Tests

### Test Slack Status Check (GET)
```bash
# Check current user's Slack membership status
curl -X GET "http://localhost:3000/api/slack/join" \
  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Response (not joined):
```json
{
  "canJoin": true,
  "isMember": false,
  "joinedAt": null,
  "rateLimit": {
    "allowed": true,
    "attemptsToday": 0,
    "maxAttempts": 3
  }
}
```

Expected Response (already member):
```json
{
  "canJoin": true,
  "isMember": true,
  "joinedAt": "2025-01-05T10:30:00Z",
  "rateLimit": {
    "allowed": true,
    "attemptsToday": 1,
    "maxAttempts": 3
  }
}
```

### Test Slack Join (POST)
```bash
# Request Slack invite for verified user
curl -X POST "http://localhost:3000/api/slack/join" \
  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Success Response:
```json
{
  "message": "Invite generated successfully",
  "url": "https://app.slack.com/client/T1234567890",
  "success": true
}
```

Expected Error Responses:

Not verified (403):
```json
{
  "error": "Only verified users can join the Slack community"
}
```

Rate limited (429):
```json
{
  "error": "Rate limit exceeded. You can try 0 more times today.",
  "attemptsToday": 3
}
```

Slack API error (500):
```json
{
  "error": "Failed to create invite"
}
```

### Test with Unauthenticated User
```bash
# Should return 401
curl -X GET "http://localhost:3000/api/slack/join" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "error": "Authentication required"
}
```

### Environment Variables Required
Make sure these are set in your `.env.local`:
```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_WORKSPACE_ID=T1234567890
NEXT_PUBLIC_SLACK_WORKSPACE_ID=T1234567890
```

### Manual Testing Checklist
1. ✅ Database migration applied successfully
2. ✅ Verified user sees Slack badge and card on dashboard
3. ✅ Non-verified user doesn't see Slack integration
4. ✅ Clicking "Join with your TPE account" generates invite
5. ✅ Successful join shows "Slack ✓" badge
6. ✅ Rate limiting works (3 attempts per day)
7. ✅ Error handling shows appropriate messages
8. ✅ Analytics events fire correctly