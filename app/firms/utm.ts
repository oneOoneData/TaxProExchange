/**
 * UTM Parameter Helper
 * Preserves marketing attribution across navigation
 */

export function withUTM(url: string, searchParams?: URLSearchParams): string {
  if (!searchParams) return url;
  
  const keep = new URLSearchParams();
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  utmKeys.forEach((key) => {
    const value = searchParams.get(key);
    if (value) keep.set(key, value);
  });
  
  const queryString = keep.toString();
  if (!queryString) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${queryString}`;
}

