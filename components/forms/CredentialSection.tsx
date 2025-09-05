'use client';

import { useState, useEffect } from 'react';
import { CredentialType, License } from '@/lib/validations/zodSchemas';

interface CredentialSectionProps {
  value: {
    credential_type: CredentialType;
    licenses: License[];
  };
  onChange: (value: { credential_type: CredentialType; licenses: License[] }) => void;
  errors?: any;
}

const CREDENTIAL_TYPES = [
  { value: 'CPA', label: 'CPA (Certified Public Accountant)' },
  { value: 'EA', label: 'EA (Enrolled Agent)' },
  { value: 'CTEC', label: 'CTEC (California Tax Education Council)' },
  { value: 'OR_Tax_Preparer', label: 'OR Tax Preparer (Oregon Board of Tax Practitioners)' },
  { value: 'OR_Tax_Consultant', label: 'OR Tax Consultant (Oregon Board of Tax Practitioners)' },
  { value: 'Tax Lawyer (JD)', label: 'Tax Lawyer (JD)' },
  { value: 'PTIN Only', label: 'PTIN Only' },
  { value: 'Other', label: 'Other Professional' },
  { value: 'Student', label: 'Student' }
];

const LICENSE_KINDS = [
  { value: 'CPA_STATE_LICENSE', label: 'CPA State License' },
  { value: 'EA_ENROLLMENT', label: 'EA Enrollment' },
  { value: 'CTEC_REG', label: 'CTEC Registration' },
  { value: 'OTHER', label: 'Other License' }
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function CredentialSection({ value, onChange, errors }: CredentialSectionProps) {
  const [licenses, setLicenses] = useState<License[]>(value.licenses || []);

  // Update licenses when value prop changes (e.g., when profile data loads)
  useEffect(() => {
    setLicenses(value.licenses || []);
  }, [value.licenses]);

  const getLicenseKindForCredential = (credential_type: CredentialType): string => {
    switch (credential_type) {
      case 'CPA': return 'CPA_STATE_LICENSE';
      case 'EA': return 'EA_ENROLLMENT';
      case 'CTEC': return 'CTEC_REG';
      case 'OR_Tax_Preparer': return 'OTHER';
      case 'OR_Tax_Consultant': return 'OTHER';
      case 'Tax Lawyer (JD)': return 'OTHER';
      case 'PTIN Only': return 'OTHER';
      case 'Other': return 'OTHER';
      default: return 'OTHER';
    }
  };

  const getIssuingAuthorityForCredential = (credential_type: CredentialType): string => {
    switch (credential_type) {
      case 'CPA': return 'State Board of Accountancy';
      case 'EA': return 'IRS';
      case 'CTEC': return 'CTEC';
      case 'OR_Tax_Preparer': return 'Oregon Board of Tax Practitioners';
      case 'OR_Tax_Consultant': return 'Oregon Board of Tax Practitioners';
      case 'Tax Lawyer (JD)': return 'State Bar';
      case 'PTIN Only': return 'IRS';
      case 'Other': return '';
      default: return '';
    }
  };

  const updateCredentialType = (credential_type: CredentialType) => {
    if (credential_type === 'Student') {
      // Students don't need licenses
      setLicenses([]);
      onChange({ credential_type, licenses: [] });
    } else {
      // Non-students need at least one license
      const licenseKind = getLicenseKindForCredential(credential_type);
      const issuingAuthority = getIssuingAuthorityForCredential(credential_type);
      
      if (licenses.length === 0) {
        const newLicense: License = {
          license_kind: licenseKind as any,
          license_number: '',
          issuing_authority: issuingAuthority,
          state: credential_type === 'CPA' ? '' : undefined,
          expires_on: '',
          board_profile_url: ''
        };
        setLicenses([newLicense]);
        onChange({ credential_type, licenses: [newLicense] });
      } else {
        // Update existing license with correct type and issuing authority
        const updatedLicenses = licenses.map(license => ({
          ...license,
          license_kind: licenseKind as any,
          issuing_authority: issuingAuthority,
          // Keep existing license_number or empty string
          license_number: license.license_number || '',
          // Clear state for non-CPA licenses
          state: credential_type === 'CPA' ? license.state : undefined
        }));
        setLicenses(updatedLicenses);
        onChange({ credential_type, licenses: updatedLicenses });
      }
    }
  };

  const updateLicense = (index: number, field: keyof License, fieldValue: any) => {
    const updatedLicenses = [...licenses];
    updatedLicenses[index] = { ...updatedLicenses[index], [field]: fieldValue };
    setLicenses(updatedLicenses);
    onChange({ credential_type: value.credential_type, licenses: updatedLicenses });
  };

          const addLicense = () => {
     const licenseKind = getLicenseKindForCredential(value.credential_type);
     const issuingAuthority = getIssuingAuthorityForCredential(value.credential_type);
     
     const newLicense: License = {
       license_kind: licenseKind as any,
       license_number: '',
       issuing_authority: issuingAuthority,
       state: value.credential_type === 'CPA' ? '' : undefined,
       expires_on: '',
       board_profile_url: ''
     };
     const updatedLicenses = [...licenses, newLicense];
     setLicenses(updatedLicenses);
     onChange({ credential_type: value.credential_type, licenses: updatedLicenses });
   };

  const removeLicense = (index: number) => {
    const updatedLicenses = licenses.filter((_, i) => i !== index);
    setLicenses(updatedLicenses);
    onChange({ credential_type: value.credential_type, licenses: updatedLicenses });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Privacy & Verification</h3>
            <p className="text-sm text-blue-800">
              <strong>This information is not made public.</strong> We only use it to verify your credentials against official registries. 
              Your public profile will show verification badges and credential types only.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Credential Type *
        </label>
        <select
          value={value.credential_type || ''}
          onChange={(e) => updateCredentialType(e.target.value as CredentialType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Please select your credential type</option>
          {CREDENTIAL_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors?.credential_type && (
          <p className="mt-1 text-sm text-red-600">{errors.credential_type}</p>
        )}
      </div>

      {value.credential_type === 'Student' ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Student profiles</strong> aren't verified or listed until a professional credential is added and approved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {licenses.map((license, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">
                  License {index + 1}
                </h4>
                {licenses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLicense(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Type
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                    {LICENSE_KINDS.find(kind => kind.value === license.license_kind)?.label || 'Auto-selected based on credential type'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically set based on your credential type
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number * (Private)
                  </label>
                  <input
                    type="text"
                    value={license.license_number || ''}
                    onChange={(e) => updateLicense(index, 'license_number', e.target.value)}
                    placeholder="Enter your license number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will never be shown publicly
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Authority *
                  </label>
                  <input
                    type="text"
                    value={license.issuing_authority || ''}
                    onChange={(e) => updateLicense(index, 'issuing_authority', e.target.value)}
                    placeholder="e.g., CA Board of Accountancy, IRS, CTEC"
                    readOnly={['CTEC', 'EA', 'PTIN Only'].includes(value.credential_type)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      ['CTEC', 'EA', 'PTIN Only'].includes(value.credential_type) 
                        ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                        : ''
                    }`}
                  />
                  {['CTEC', 'EA', 'PTIN Only'].includes(value.credential_type) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically set for {value.credential_type} credentials
                    </p>
                  )}
                </div>

                {license.license_kind === 'CPA_STATE_LICENSE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State * (Required for CPA)
                    </label>
                    <select
                      value={license.state || ''}
                      onChange={(e) => updateLicense(index, 'state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select State</option>
                      {US_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={license.expires_on || ''}
                    onChange={(e) => updateLicense(index, 'expires_on', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Board Profile URL
                  </label>
                  <input
                    type="text"
                    value={license.board_profile_url || ''}
                    onChange={(e) => updateLicense(index, 'board_profile_url', e.target.value)}
                    placeholder="example.com or https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link to official board lookup (optional) - https:// will be added automatically
                  </p>
                </div>
              </div>

              
            </div>
          ))}

          {licenses.length === 0 && (
            <button
              type="button"
              onClick={addLicense}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              + Add License
            </button>
          )}

          {licenses.length > 0 && (
            <button
              type="button"
              onClick={addLicense}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Another License
            </button>
          )}

          {errors?.licenses && (
            <p className="text-sm text-red-600">{errors.licenses}</p>
          )}
        </div>
      )}
    </div>
  );
}
