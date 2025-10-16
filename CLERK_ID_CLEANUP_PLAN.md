# Clerk ID Column Cleanup Plan

## Problem
The `profiles` table has two Clerk ID columns (`clerk_id` and `clerk_user_id`) from an incomplete migration. This causes:
- Profile lookup inconsistencies
- Update failures (like Jeremy's bug)
- Code confusion (different endpoints use different columns)

## Current State

### Columns
- `clerk_id` (position 21) - newer column
- `clerk_user_id` (position 30) - legacy column

### Code Using `clerk_user_id` (Legacy):
- `app/api/profile/create/route.ts` (line 40)
- `app/api/firms/route.ts` (line 105) - sets BOTH
- `app/api/messages/unread/route.ts` (line 30) - fallback
- `app/api/connections/pending/route.ts` (line 29) - fallback
- `lib/authz.ts` - multiple places
- `lib/db/profile.ts` (line 62) - tries both with OR
- Several debug endpoints

### Code Using `clerk_id` (Current):
- `app/api/profile/route.ts` - main profile endpoint

## Recommended Solution

### Phase 1: Data Migration (Safe) ✅ DO THIS FIRST
```sql
-- 1. Check current state
SELECT 
  COUNT(*) as total_profiles,
  COUNT(clerk_id) as has_clerk_id,
  COUNT(clerk_user_id) as has_clerk_user_id,
  COUNT(CASE WHEN clerk_id IS NOT NULL AND clerk_user_id IS NOT NULL AND clerk_id != clerk_user_id THEN 1 END) as mismatched
FROM profiles;

-- 2. Sync clerk_user_id into clerk_id where clerk_id is NULL
UPDATE profiles
SET clerk_id = clerk_user_id
WHERE clerk_id IS NULL 
  AND clerk_user_id IS NOT NULL;

-- 3. Report any remaining issues
SELECT id, first_name, last_name, public_email, clerk_id, clerk_user_id
FROM profiles
WHERE clerk_id IS NULL OR clerk_user_id IS NULL
  OR clerk_id != clerk_user_id;
```

### Phase 2: Code Consolidation (After migration)
Replace all `clerk_user_id` references with `clerk_id`:

**Priority files to update:**
1. ❗ `app/api/profile/create/route.ts` - change line 26, 40
2. ❗ `app/api/firms/route.ts` - remove `clerk_user_id` from line 105
3. ❗ `lib/authz.ts` - update all 4 occurrences
4. `lib/db/profile.ts` - simplify to only use clerk_id
5. `app/api/messages/unread/route.ts` - remove fallback
6. `app/api/connections/pending/route.ts` - remove fallback

### Phase 3: Database Cleanup (Final step)
```sql
-- After verifying everything works:
ALTER TABLE profiles DROP COLUMN clerk_user_id;
```

## Quick Fix (Already Applied) ✅

**File**: `app/api/profile/route.ts`
- Changed UPDATE to use profile ID instead of clerk_id
- Syncs clerk_id in update data

This fixes the immediate bug but doesn't address the root cause of dual columns.

## Testing Strategy

1. **Before migration**: Check for profiles with mismatched IDs
2. **After migration**: Verify all profiles have consistent clerk_id
3. **After code changes**: Test all auth flows (login, profile update, firm creation)
4. **Before column drop**: Run in production for 1-2 weeks, monitor for errors

## Impact Assessment

**Risk**: LOW (if done in phases)
**Effort**: 2-4 hours
**User Impact**: NONE (if migration done correctly)
**Benefit**: Eliminates entire class of bugs, simplifies codebase

