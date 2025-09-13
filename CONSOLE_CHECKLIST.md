# Console Checklist for Domain Split

## Clerk Configuration

### 1. Allowed Origins
- Go to Clerk Dashboard → Settings → Domains
- Add the following domains:
  - `https://www.taxproexchange.com`
  - `https://app.taxproexchange.com`

### 2. Redirect URLs
- Go to Clerk Dashboard → Settings → Paths
- Update the following URLs:
  - **Sign-in URL**: `https://app.taxproexchange.com/sign-in`
  - **Sign-up URL**: `https://app.taxproexchange.com/sign-up`
  - **After sign-in URL**: `https://app.taxproexchange.com/`
  - **After sign-up URL**: `https://app.taxproexchange.com/onboarding`

### 3. OAuth Providers
- Go to Clerk Dashboard → User & Authentication → Social Connections
- For each OAuth provider (Google, LinkedIn), update:
  - **Redirect URLs**: Add `https://app.taxproexchange.com/v1/oauth_callback`
  - **Allowed Origins**: Add `https://app.taxproexchange.com`

## Supabase Configuration

### 1. Auth Settings
- Go to Supabase Dashboard → Authentication → URL Configuration
- Update the following:
  - **Site URL**: `https://app.taxproexchange.com`
  - **Redirect URLs**: Add:
    - `https://app.taxproexchange.com/auth/callback`
    - `https://app.taxproexchange.com/auth/callback/google`
    - `https://app.taxproexchange.com/auth/callback/linkedin`

### 2. Email Templates
- Go to Supabase Dashboard → Authentication → Email Templates
- Update all email templates to use `https://app.taxproexchange.com` in links
- Check: Confirm email, Magic Link, Password Reset, etc.

## Google OAuth (if using directly)

### 1. Google Cloud Console
- Go to Google Cloud Console → APIs & Services → Credentials
- Find your OAuth 2.0 Client ID
- Update **Authorized redirect URIs**:
  - `https://app.taxproexchange.com/api/auth/callback/google`
  - `https://app.taxproexchange.com/v1/oauth_callback` (for Clerk)

## LinkedIn OAuth (if using directly)

### 1. LinkedIn Developer Portal
- Go to LinkedIn Developer Portal → Your App → Auth
- Update **Authorized redirect URLs**:
  - `https://app.taxproexchange.com/api/auth/callback/linkedin`
  - `https://app.taxproexchange.com/v1/oauth_callback` (for Clerk)

## Vercel Configuration

### 1. Domain Setup
- Go to Vercel Dashboard → Your Project → Settings → Domains
- Add the following domains:
  - `www.taxproexchange.com` (marketing site)
  - `app.taxproexchange.com` (app site)

### 2. Environment Variables
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add/update the following:
  ```
  NEXT_PUBLIC_BASE_URL=https://app.taxproexchange.com
  NEXT_PUBLIC_GA_MEASUREMENT_ID_SITE=G-XXXXXXXXXX
  NEXT_PUBLIC_GA_MEASUREMENT_ID_APP=G-YYYYYYYYYY
  ```

## DNS Configuration

### 1. Domain Records
Ensure the following DNS records are set up:
- `www.taxproexchange.com` → CNAME to Vercel
- `app.taxproexchange.com` → CNAME to Vercel
- `taxproexchange.com` → A record or CNAME to Vercel (for canonicalization)

## Testing Checklist

### 1. Redirect Tests
- [ ] Visit `https://www.taxproexchange.com/app/login` → should redirect to `https://app.taxproexchange.com/login`
- [ ] Visit `https://taxproexchange.com` → should redirect to `https://www.taxproexchange.com`

### 2. SEO Tests
- [ ] Visit `https://www.taxproexchange.com/robots.txt` → should allow crawling
- [ ] Visit `https://app.taxproexchange.com/robots.txt` → should disallow all
- [ ] Check canonical URLs on marketing pages
- [ ] Verify noindex meta tags on app pages

### 3. Analytics Tests
- [ ] Marketing site should load GA with SITE measurement ID
- [ ] App site should load GA with APP measurement ID (if configured)
- [ ] No cross-contamination between analytics

### 4. Auth Tests
- [ ] Sign-in/sign-up flows work on app subdomain
- [ ] OAuth callbacks redirect to app subdomain
- [ ] Session cookies work across subdomains

## Rollback Plan

If issues arise:
1. Revert `next.config.js` to original state
2. Remove domain-specific configurations
3. Update auth provider redirects back to single domain
4. Test thoroughly before re-attempting
