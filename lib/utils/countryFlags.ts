// Country flag emojis for display
export const COUNTRY_FLAGS: Record<string, string> = {
  'US': '🇺🇸',
  'CA': '🇨🇦',
  'MX': '🇲🇽',
  'GB': '🇬🇧',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'IT': '🇮🇹',
  'ES': '🇪🇸',
  'NL': '🇳🇱',
  'BE': '🇧🇪',
  'CH': '🇨🇭',
  'AT': '🇦🇹',
  'SE': '🇸🇪',
  'NO': '🇳🇴',
  'DK': '🇩🇰',
  'FI': '🇫🇮',
  'PL': '🇵🇱',
  'CZ': '🇨🇿',
  'HU': '🇭🇺',
  'RO': '🇷🇴',
  'BG': '🇧🇬',
  'HR': '🇭🇷',
  'SI': '🇸🇮',
  'SK': '🇸🇰',
  'LT': '🇱🇹',
  'LV': '🇱🇻',
  'EE': '🇪🇪',
  'IE': '🇮🇪',
  'PT': '🇵🇹',
  'GR': '🇬🇷',
  'CY': '🇨🇾',
  'MT': '🇲🇹',
  'LU': '🇱🇺',
  'JP': '🇯🇵',
  'KR': '🇰🇷',
  'CN': '🇨🇳',
  'IN': '🇮🇳',
  'AU': '🇦🇺',
  'NZ': '🇳🇿',
  'SG': '🇸🇬',
  'HK': '🇭🇰',
  'TW': '🇹🇼',
  'TH': '🇹🇭',
  'MY': '🇲🇾',
  'ID': '🇮🇩',
  'PH': '🇵🇭',
  'VN': '🇻🇳',
  'BR': '🇧🇷',
  'AR': '🇦🇷',
  'CL': '🇨🇱',
  'CO': '🇨🇴',
  'PE': '🇵🇪',
  'VE': '🇻🇪'
};

export const getCountryFlag = (countryCode: string): string => {
  return COUNTRY_FLAGS[countryCode] || '🌍';
};

export const getLocationDisplay = (profile: {
  primary_location?: { country?: string; state?: string; city?: string; display_name?: string } | null;
  works_multistate?: boolean;
  works_international?: boolean;
  countries?: string[];
}): { flag: string; text: string } => {
  // Show red pin with country (or state if US)
  if (profile.primary_location?.state && profile.primary_location?.country === 'US') {
    return { flag: '📍', text: profile.primary_location.state };
  }

  if (profile.primary_location?.country) {
    return { flag: '📍', text: profile.primary_location.country };
  }

  return { flag: '📍', text: 'Remote' };
};
