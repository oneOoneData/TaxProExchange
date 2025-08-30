export const LEGAL_VERSIONS = {
  TOS: 'v1',
  PRIVACY: 'v1',
} as const;

export type LegalVersion = typeof LEGAL_VERSIONS[keyof typeof LEGAL_VERSIONS];
