/**
 * Single source of truth for building absolute app URLs.
 *
 * Fixes the double-slash bug: NEXT_PUBLIC_APP_URL in prod/local env carries a
 * trailing slash ("https://www.taxproexchange.com/"), and call sites across
 * the codebase build links as `${BASE}/path`, producing `.com//path`. This
 * helper normalizes both sides of the join so it's safe regardless of how
 * the env var is set.
 */
const DEFAULT_APP_URL = 'https://www.taxproexchange.com';

/**
 * The app's base URL, with any trailing slash(es) stripped. Safe to
 * concatenate directly as `${getAppBaseUrl()}/path` without producing a
 * double slash, regardless of how the underlying env var is set.
 */
export function getAppBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    DEFAULT_APP_URL;

  return raw.replace(/\/+$/, '');
}

/**
 * Build an absolute URL under the app's base URL.
 *
 * `absoluteUrl('/jobs/123/applications')` -> "https://www.taxproexchange.com/jobs/123/applications"
 * Works whether `path` does or doesn't start with a slash.
 */
export function absoluteUrl(path: string = ''): string {
  const base = getAppBaseUrl();
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '';
  return `${base}${normalizedPath}`;
}
