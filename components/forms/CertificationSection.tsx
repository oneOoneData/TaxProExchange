'use client';

import { Certification, CertificationKind } from '@/lib/validations/zodSchemas';

interface CertificationSectionProps {
  value: Certification[];
  onChange: (value: Certification[]) => void;
  errors?: any;
}

const CERTIFICATION_KINDS = [
  { value: 'QBO_PROADVISOR', label: 'QuickBooks Online ProAdvisor (Certified)' },
  { value: 'QBO_PROADVISOR_ADVANCED', label: 'QuickBooks Online ProAdvisor (Advanced Certified)' },
  { value: 'XERO_CERTIFIED', label: 'Xero Certified Advisor' },
  { value: 'AIPB_CB', label: 'Certified Bookkeeper (AIPB)' },
  { value: 'NACPB_CPB', label: 'Certified Public Bookkeeper (NACPB)' },
  { value: 'OTHER', label: 'Other certification' }
];

export default function CertificationSection({ value, onChange, errors }: CertificationSectionProps) {
  const certifications = value || [];

  const addCertification = () => {
    const newCertification: Certification = {
      kind: 'QBO_PROADVISOR' as CertificationKind,
      issuer: '',
      cert_number: '',
      expires_on: '',
      notes: ''
    };
    onChange([...certifications, newCertification]);
  };

  const updateCertification = (index: number, field: keyof Certification, fieldValue: any) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  const removeCertification = (index: number) => {
    onChange(certifications.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bookkeeping / software certifications
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Self-reported for now — QuickBooks ProAdvisor, Xero Certified, AIPB, NACPB, etc.
          These are shown on your public profile (issuer &amp; expiry only, never your certificate
          number).
        </p>
      </div>

      {certifications.map((certification, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">
              Certification {index + 1}
            </h4>
            <button
              type="button"
              onClick={() => removeCertification(index)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certification
              </label>
              <select
                value={certification.kind}
                onChange={(e) => updateCertification(index, 'kind', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CERTIFICATION_KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuer (optional)
              </label>
              <input
                type="text"
                value={certification.issuer || ''}
                onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                placeholder="e.g., Intuit, Xero"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate number (optional, private)
              </label>
              <input
                type="text"
                value={certification.cert_number || ''}
                onChange={(e) => updateCertification(index, 'cert_number', e.target.value)}
                placeholder="Never shown publicly"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">This will never be shown publicly</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration date (optional)
              </label>
              <input
                type="date"
                value={certification.expires_on || ''}
                onChange={(e) => updateCertification(index, 'expires_on', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={certification.notes || ''}
                onChange={(e) => updateCertification(index, 'notes', e.target.value)}
                placeholder="Anything else worth mentioning about this certification"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCertification}
        className={
          certifications.length === 0
            ? 'w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors'
            : 'text-blue-600 hover:text-blue-800 text-sm font-medium'
        }
      >
        {certifications.length === 0 ? '+ Add Certification' : '+ Add Another Certification'}
      </button>

      {errors?.certifications && (
        <p className="text-sm text-red-600">{errors.certifications}</p>
      )}
    </div>
  );
}
