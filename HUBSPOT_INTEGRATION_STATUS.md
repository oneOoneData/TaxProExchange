# HubSpot Integration Status & Test Guide

## Overview
Your HubSpot integration is **implemented** and ready to sync user contacts when email preferences are updated. However, it needs to be **configured** with API credentials to work.

---

## ✅ What's Implemented

### 1. **Core Integration** (`lib/hubspot.ts`)
- Upsert contact by email (search → update or create)
- Automatic retry logic for rate limits and server errors
- Supports both Private App tokens (`HUBSPOT_TOKEN`) and legacy API keys (`HUBSPOT_API_KEY`)
- Sets custom property `tpe_marketing_opt_in` for marketing consent tracking

### 2. **API Endpoints**

**`/api/hubspot/sync-contact`**
- Purpose: Sync a single contact
- Called by: Settings page and onboarding flow
- Method: POST
- Payload: `{ email, first_name, last_name, marketing_opt_in }`

**`/api/hubspot/backfill`**
- Purpose: One-time sync of all existing profiles
- Protected by: `CRON_SECRET` bearer token
- Usage: Manual backfill when you first enable HubSpot

**`/api/hubspot/reconcile`**
- Purpose: Daily sync of recently updated profiles (24h window)
- Protected by: `CRON_SECRET` bearer token
- Triggered by: Vercel CRON at 09:00 UTC daily

### 3. **Integration Points**

**Profile Updates** (`app/api/profile/route.ts:719`)
- Triggered when: User updates email preferences
- Action: Fire-and-forget call to `/api/hubspot/sync-contact`
- Non-blocking: Logs errors but doesn't fail the user request

**CRON Job** (`vercel.json`)
- Schedule: Daily at 09:00 UTC
- Path: `/api/hubspot/reconcile`
- Purpose: Catch any profiles that failed to sync

---

## 🔧 Configuration Required

### Option 1: Private App Token (Recommended)

1. Go to **HubSpot Settings → Integrations → Private Apps**
2. Click **Create a private app**
3. Give it a name (e.g., "TaxProExchange")
4. Go to **Scopes** tab and enable:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
5. Copy the token
6. Add to your `.env` file:
   ```
   HUBSPOT_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### Option 2: Legacy API Key

1. Go to **HubSpot Settings → Integrations → API Key**
2. Copy the API key
3. Add to your `.env` file:
   ```
   HUBSPOT_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

---

## 🧪 Testing the Integration

### Method 1: Test API Endpoint

Start your dev server:
```bash
npm run dev
```

Visit in your browser:
```
http://localhost:3000/api/test/hubspot
```

This will:
- ✅ Check if credentials are configured
- ✅ Test creating/updating a test contact
- ✅ Provide detailed diagnostics and troubleshooting

### Method 2: Manual Sync Test

Use curl or Postman:
```bash
curl -X POST http://localhost:3000/api/hubspot/sync-contact \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "marketing_opt_in": false
  }'
```

Expected response:
```json
{
  "ok": true,
  "operation": "create",
  "contactId": "123456"
}
```

### Method 3: User Flow Test

1. Sign in to your app
2. Go to Settings
3. Update email preferences (toggle marketing consent)
4. Check server logs for HubSpot sync confirmation
5. Verify contact appears in HubSpot CRM

---

## 📋 Custom Property Setup

To track marketing consent, create a custom property in HubSpot:

1. Go to **Settings → Properties → Contact Properties**
2. Click **Create property**
3. Settings:
   - **Property name**: `tpe_marketing_opt_in`
   - **Label**: TPE Marketing Opt In
   - **Type**: Single checkbox
   - **Group**: Contact information
4. Click **Create**

---

## 🔍 Current Status Check

**Configuration Status:**
- ❓ `HUBSPOT_TOKEN`: Unknown (not in `env.example`)
- ❓ `HUBSPOT_API_KEY`: Unknown (not in `env.example`)
- ❓ `CRON_SECRET`: Unknown (in `env.example` but not set)

**To check if it's working:**
1. Run the test endpoint: `/api/test/hubspot`
2. Check if environment variables are set in Vercel/local `.env`

---

## 🚀 Deployment Checklist

### Production (Vercel)

1. **Set Environment Variables:**
   - Go to Vercel Project Settings → Environment Variables
   - Add `HUBSPOT_TOKEN` (or `HUBSPOT_API_KEY`)
   - Add `CRON_SECRET` (random secure string)
   - Deploy to apply changes

2. **Test in Production:**
   - Visit `https://your-app.com/api/test/hubspot`
   - Verify successful sync

3. **Backfill Existing Users (Optional):**
   ```bash
   curl -X POST https://your-app.com/api/hubspot/backfill \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **Verify CRON Job:**
   - Check Vercel Logs → Cron tab
   - Confirm daily reconciliation runs at 09:00 UTC

---

## 🐛 Troubleshooting

### "not_configured" Error
- **Cause**: No `HUBSPOT_TOKEN` or `HUBSPOT_API_KEY` set
- **Fix**: Add credentials to environment variables

### "search_failed" or "create_failed" Error
- **Causes**:
  - Invalid or expired API token
  - Insufficient permissions (missing CRM scopes)
  - HubSpot account issues
- **Fix**: Regenerate token with correct scopes

### Integration Silent (No Logs)
- **Check**: Is the sync being triggered?
  - Look for email preferences updates in `/api/profile`
  - Check server logs for "HubSpot sync" messages
- **Note**: Sync is fire-and-forget, so it won't block user requests

### Contacts Not Appearing in HubSpot
- **Check**:
  - Verify credentials are correct
  - Check HubSpot → Contacts → All contacts
  - Search by email address
  - Review HubSpot API logs in portal

---

## 📊 Monitoring

### Check Sync Status
- **Vercel Logs**: Filter for "HubSpot" to see sync activity
- **HubSpot Activity Log**: Settings → Account → Activity log

### Review CRON Performance
- Vercel Dashboard → Project → Cron
- Shows execution history and success rate

---

## 🔄 Next Steps

1. **Configure credentials** (if not already done)
2. **Run test endpoint** to verify working
3. **Test user flow** (update email preferences)
4. **Set up custom property** in HubSpot
5. **Backfill existing users** (optional)
6. **Monitor CRON job** in production

---

**Last Updated**: October 11, 2025

