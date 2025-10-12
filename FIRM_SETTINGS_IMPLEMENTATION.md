# Firm Settings & Subscription Management

## Overview
Complete settings page for firms to manage subscriptions, team members, and account deletion.

---

## What's Implemented

### 1. Trial Period Removed ✅
- Set to 0 days in `lib/stripe.ts`
- Updated all UI text to remove trial references
- Users can test the free platform before subscribing

### 2. Firm Settings Page ✅
**Location**: `/team/settings`

**Features**:
- **Subscription Management**
  - View current subscription status (Active/Inactive)
  - See next billing date
  - "Manage Billing & Cancel Subscription" button (opens Stripe Customer Portal)
  - Reactivate subscription if canceled

- **Team Members Management**
  - View all firm members (admins/managers/members)
  - See roles and member details
  - Remove members (admins only, can't remove other admins)
  - Invite new team members (placeholder for future)

- **Danger Zone**
  - Delete firm account (admins only)
  - Shows confirmation with list of what will be deleted
  - Cascading delete removes members, bench, and all data

### 3. API Endpoints Created ✅

#### GET /api/firm-members
- Lists all active members of a firm
- Includes profile details (name, email, avatar)
- Requires user to be a member of the firm

#### DELETE /api/firm-members/[id]
- Remove a team member from the firm
- Only admins can remove members
- Can't remove admin members
- Sets status to 'removed' (soft delete)

#### DELETE /api/firms/[id]
- Delete the entire firm
- Only admins can delete
- Cascade deletes all members and bench items
- TODO: Auto-cancel Stripe subscription

### 4. Navigation Updated ✅
- Added "Settings" link to firm navigation
- Visible when viewing team pages

---

## User Flows

### For Admins:
1. Click "Settings" in nav
2. View subscription status
3. Click "Manage Billing & Cancel Subscription" → Opens Stripe Portal
4. In Stripe Portal: Update payment, view invoices, cancel subscription
5. View team members and remove if needed
6. Delete firm account if desired

### For Managers/Members:
1. Click "Settings" in nav
2. View subscription status (read-only)
3. View team members (can't remove)
4. No access to billing or delete options

---

## Stripe Customer Portal Features

When admins click "Manage Billing", they get redirected to Stripe's Customer Portal where they can:
- ✅ Update payment method
- ✅ View billing history & invoices
- ✅ **Cancel subscription** (immediately or at period end)
- ✅ Reactivate canceled subscription
- ✅ Download receipts

---

## File Manifest

### Created Files:
1. `app/(firm)/team/settings/page.tsx` - Settings page UI
2. `app/api/firm-members/route.ts` - List members
3. `app/api/firm-members/[id]/route.ts` - Remove member
4. `app/api/firms/[id]/route.ts` - Delete firm

### Modified Files:
1. `lib/stripe.ts` - Removed trial period
2. `app/(onboarding)/firm/page.tsx` - Updated copy to remove trial
3. `app/(firm)/team/page.tsx` - Updated subscription gate text
4. `app/(firm)/layout.tsx` - Added Settings link to nav

---

## Screenshots / Flow

### Settings Page Sections:

```
┌─────────────────────────────────────────┐
│ ← Back to Team                          │
│ Firm Settings                           │
│ Smith & Associates CPA                  │
├─────────────────────────────────────────┤
│ Subscription                            │
│   Status: [Active]                      │
│   Plan: Firm Workspace - $10/month     │
│   Next billing: Jan 15, 2026            │
│   [Manage Billing & Cancel Subscription]│
├─────────────────────────────────────────┤
│ Team Members                            │
│   👤 John Smith (admin)                 │
│   👤 Jane Doe (manager)  [Remove]       │
│   👤 Bob Wilson (member) [Remove]       │
│   [Invite Team Member]                  │
├─────────────────────────────────────────┤
│ ⚠️ Danger Zone                          │
│   Permanently delete this firm...       │
│   [Delete Firm Account]                 │
└─────────────────────────────────────────┘
```

---

## Testing Checklist

### Subscription Management:
- [ ] View active subscription status
- [ ] Click "Manage Billing" → redirects to Stripe
- [ ] Cancel subscription in Stripe
- [ ] Return to settings → see "Inactive" status
- [ ] Click "Activate Subscription" → redirects to checkout

### Team Members:
- [ ] View list of all team members
- [ ] Remove a manager (as admin)
- [ ] Try to remove admin (blocked)
- [ ] Try to remove member as non-admin (blocked)

### Firm Deletion:
- [ ] Click "Delete Firm Account"
- [ ] See confirmation dialog
- [ ] Confirm deletion
- [ ] Redirected to dashboard
- [ ] Firm and all data removed from database

---

## Security Notes

- ✅ Only admins can access billing management
- ✅ Only admins can remove members
- ✅ Only admins can delete firm
- ✅ Can't remove admin members (prevents lockout)
- ✅ All actions verified server-side
- ✅ RLS policies enforced on database

---

## Future Enhancements

1. **Team Member Invitations**
   - Send email invites to join as team member
   - Acceptance flow
   - Assign roles during invitation

2. **Auto-Cancel Subscription on Delete**
   - When firm is deleted, automatically cancel Stripe subscription
   - Currently admins should cancel manually first

3. **Audit Log**
   - Track who made changes (removed members, changed settings)
   - Display in settings page

4. **Role Management**
   - Promote/demote members between roles
   - Transfer admin role

5. **Bulk Actions**
   - Remove multiple members at once
   - Export member list

---

## Summary

✅ **No trial period** - Firms pay $10/month immediately  
✅ **Full settings page** - Subscription, team, and account management  
✅ **Cancel via Stripe** - Professional billing portal  
✅ **Team member management** - View, add (coming soon), remove  
✅ **Account deletion** - Admins can delete entire firm  
✅ **Proper security** - Role-based access control  

Users now have complete control over their firm workspace subscription and team!

