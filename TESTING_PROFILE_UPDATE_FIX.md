# Testing Profile Update Bug Fix

## The Bug
User profiles found by email (but with mismatched clerk_id) couldn't be updated because the UPDATE query used clerk_id instead of profile ID.

## Quick Test (Recommended)

### Setup: Create the test condition
1. **In Supabase Console**, run this query to create a test scenario:
   ```sql
   -- Find your current profile
   SELECT id, clerk_id, public_email, first_name 
   FROM profiles 
   WHERE public_email = 'YOUR_EMAIL@taxpro.exchange';
   
   -- Temporarily change YOUR profile's clerk_id to something wrong
   -- (Save your real clerk_id first!)
   UPDATE profiles 
   SET clerk_id = 'user_WRONG_CLERK_ID_TEST123'
   WHERE public_email = 'YOUR_EMAIL@taxpro.exchange';
   ```

2. **Your real clerk_id**: Find it in your browser
   - Open DevTools → Application → Cookies
   - Look for `__session` cookie
   - Decode it at jwt.io to find your real clerk_id (it's in the `sub` field)

### Test: Try to update your profile
3. **Go to**: https://taxpro.exchange/onboarding (or wherever profile edit is)

4. **Make any change** and submit

5. **Check the result**:
   - ❌ **Before fix**: Would get "Cannot coerce the result to a single JSON object"
   - ✅ **After fix**: Profile updates successfully

### Verify: Check the database
6. **In Supabase Console**, verify clerk_id was synced:
   ```sql
   SELECT id, clerk_id, public_email, first_name, updated_at
   FROM profiles 
   WHERE public_email = 'YOUR_EMAIL@taxpro.exchange';
   ```
   
   - The `clerk_id` should now match your REAL clerk_id
   - The `updated_at` should be recent

### Cleanup: Restore if needed
7. If test didn't work, restore manually:
   ```sql
   UPDATE profiles 
   SET clerk_id = 'YOUR_REAL_CLERK_ID_HERE'
   WHERE public_email = 'YOUR_EMAIL@taxpro.exchange';
   ```

---

## Alternative: Test Jeremy's Profile Directly

If you want to just have Jeremy test, simply:

1. **Deploy the fix**: `vercel --prod` or push to main
2. **Ask Jeremy to retry**: Go to https://taxpro.exchange/onboarding
3. **Monitor logs**: Check Vercel logs for success

His profile will be automatically fixed on first successful update:
- The lookup finds his profile by email `jeremy@steadfastbookkeeping.com`
- The update now uses profile ID (works!)
- His clerk_id gets synced to `user_34AJKOI8P7wDo5rGKRRlXkOVHu5`

---

## What to Look For

### Success Indicators:
✅ Profile update completes without error
✅ Vercel logs show: "✅ Specializations saved successfully"
✅ Database: clerk_id matches current session
✅ User redirected to profile page

### Failure Indicators:
❌ Error: "Cannot coerce the result to a single JSON object"
❌ Vercel logs show: "Profile save error: PGRST116"
❌ Database: clerk_id still mismatched

