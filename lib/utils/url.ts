/**
 * Normalizes a URL by adding https:// protocol if missing
 * @param url - The URL to normalize
 * @returns The normalized URL with protocol, or empty string if input is empty
 */
export function normalizeUrl(url: string | null | undefined): string {
  if (!url || url.trim() === '') {
    return '';
  }
  
  const trimmedUrl = url.trim();
  
  // If URL already has a protocol, return as-is
  if (trimmedUrl.match(/^https?:\/\//i)) {
    return trimmedUrl;
  }
  
  // If URL starts with //, add https:
  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`;
  }
  
  // If URL doesn't start with protocol, add https://
  return `https://${trimmedUrl}`;
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
    new URL(normalizedUrl);
    return true;
  } catch {
    return false;
  }
}
