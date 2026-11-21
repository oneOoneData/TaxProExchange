/**
 * Normalizes a URL by adding https:// protocol if missing.
 *
 * Also repairs common malformed schemes users type by hand, e.g.
 * "https//site.com", "https:/site.com", "https:\\site.com", "http;//site.com",
 * "https://https://site.com" — which previously got another "https://"
 * prepended and produced links pointing at a host named "https".
 *
 * @param url - The URL to normalize
 * @returns The normalized URL with protocol, or empty string if input is empty
 */
export function normalizeUrl(url: string | null | undefined): string {
  if (!url || url.trim() === '') {
    return '';
  }

  let trimmedUrl = url.trim().replace(/\s+/g, '');

  // Strip any number of leading (possibly malformed) http/https schemes,
  // remembering whether the user intended plain http.
  // Requires a separator so hostnames like "httpbin.org" or "https-tax.com" stay intact.
  const schemeRe = /^(https?)(?:[:;][\/\\]{0,3}|[\/\\]{1,3})/i;
  let scheme: 'http' | 'https' | null = null;
  let match: RegExpMatchArray | null;
  while ((match = trimmedUrl.match(schemeRe))) {
    if (!scheme) scheme = match[1].toLowerCase() as 'http' | 'https';
    trimmedUrl = trimmedUrl.slice(match[0].length);
  }

  // Protocol-relative URL ("//site.com")
  trimmedUrl = trimmedUrl.replace(/^[\/\\]+/, '');

  if (!trimmedUrl) return '';

  return `${scheme ?? 'https'}://${trimmedUrl}`;
}

/**
 * Validates if a string is a valid URL (after normalization)
 * @param url - The URL to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') {
    return true; // Empty URLs are considered valid
  }

  try {
    const normalizedUrl = normalizeUrl(url);
    const parsed = new URL(normalizedUrl);
    // Require a dotted hostname (rejects "https://https" style breakage)
    return parsed.hostname.includes('.');
  } catch {
    return false;
  }
}
