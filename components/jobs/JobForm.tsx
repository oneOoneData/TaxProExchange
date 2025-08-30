'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SLAPreview } from './SLAPreview';

interface JobFormData {
  title: string;
  description: string;
  deadline_date: string;
  payout_type: 'fixed' | 'hourly' | 'per_return';
  payout_fixed: string;
  payout_min: string;
  payout_max: string;
  payment_terms: string;
  credentials_required: string[];
  software_required: string[];
  specialization_keys: string[];
  volume_count: string;
  trial_ok: boolean;
  insurance_required: boolean;
  location_us_only: boolean;
  location_states: string[];
  location_countries: string[];
  remote_ok: boolean;
  sla: any;
}

const defaultSLA = {
  response_time_hours: 24,
  draft_turnaround_days: 5,
  revision_rounds_included: 1,
  data_exchange: "Portal-only (no email attachments)",
  security: "No unmasked PII in chat; use platform storage",
  dispute: "If scope creep, pause work and request change in writing"
};

const specializations = [
  { value: 's_corp', label: 'S-Corporation' },
  { value: 'multi_state', label: 'Multi-State' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'irs_rep', label: 'IRS Representation' },
  { value: '1040', label: 'Individual Returns' },
  { value: 'business', label: 'Business Returns' },
  { value: 'partnership', label: 'Partnership Returns' },
  { value: 'estate_tax', label: 'Estate & Gift Tax' },
  { value: 'international', label: 'International Tax' },
  { value: 'education_credits_aotc_llc', label: 'Education Credits (AOTC/LLC)' },
  { value: 'eitc_ctc_actc', label: 'EITC/CTC/ACTC' },
  { value: 'energy_credits_5695_ev_8936', label: 'Energy Credits (5695/EV/8936)' },
  { value: 'home_purchase_sale', label: 'Home Purchase/Sale' },
  { value: 'new_child_dependents', label: 'New Child/Dependents' },
  { value: 'retirement_income_ss_medicare', label: 'Retirement Income (SS/Medicare)' },
  { value: 'multistate_apportionment', label: 'Multi-State Apportionment' },
  { value: 'ca_specific', label: 'CA Specific' },
  { value: 'city_county_local_tax', label: 'City/County Local Tax' },
  { value: 'ny_specific', label: 'NY Specific' },
  { value: 'tx_specific', label: 'TX Specific' },
  { value: '1065_partnership', label: '1065 Partnership' },
  { value: '1120s_s_corp', label: '1120S S-Corp' }
];

const credentials = [
  { value: 'CPA', label: 'CPA' },
  { value: 'EA', label: 'EA' },
  { value: 'CTEC', label: 'CTEC' },
  { value: 'Tax_Lawyer', label: 'Tax Lawyer (JD)' },
  { value: 'PTIN_ONLY', label: 'PTIN Only' }
];

const software = [
  { value: 'proseries', label: 'ProSeries' },
  { value: 'drake', label: 'Drake' },
  { value: 'turbotax', label: 'TurboTax' },
  { value: 'lacerte', label: 'Lacerte' },
  { value: 'ultratax', label: 'UltraTax' },
  { value: 'taxact', label: 'TaxAct' },
  { value: 'taxslayer', label: 'TaxSlayer' },
  { value: 'taxdome', label: 'TaxDome' },
  { value: 'canopy', label: 'Canopy' },
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'xero', label: 'Xero' },
  { value: 'freshbooks', label: 'FreshBooks' }
];
const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function JobForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    deadline_date: '',
    payout_type: 'fixed',
    payout_fixed: '',
    payout_min: '',
    payout_max: '',
    payment_terms: '',
    credentials_required: [],
    software_required: [],
    specialization_keys: [],
    volume_count: '',
    trial_ok: false,
    insurance_required: false,
    location_us_only: true,
    location_states: [],
    location_countries: [],
    remote_ok: true,
    sla: defaultSLA
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: keyof JobFormData, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }
    if (!formData.payout_type) {
      newErrors.payout_type = 'Payout type is required';
    }
    if (formData.payout_type === 'fixed' && !formData.payout_fixed) {
      newErrors.payout_fixed = 'Fixed amount is required for fixed payout type';
    }
    if ((formData.payout_type === 'hourly' || formData.payout_type === 'per_return') && (!formData.payout_min || !formData.payout_max)) {
      newErrors.payout_min = 'Min and max amounts are required for hourly/per-return payout types';
      newErrors.payout_max = 'Min and max amounts are required for hourly/per-return payout types';
    }
    if (formData.payout_min && formData.payout_max && parseFloat(formData.payout_min) > parseFloat(formData.payout_max)) {
      newErrors.payout_max = 'Maximum amount must be greater than minimum amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          payout_fixed: formData.payout_fixed ? parseFloat(formData.payout_fixed) : null,
          payout_min: formData.payout_min ? parseFloat(formData.payout_min) : null,
          payout_max: formData.payout_max ? parseFloat(formData.payout_max) : null,
          volume_count: formData.volume_count ? parseInt(formData.volume_count) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/jobs/${data.job.id}`);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to create job' });
      }
    } catch (error) {
      console.error('Error creating job:', error);
      setErrors({ submit: 'Failed to create job. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Senior Tax Preparer for S-Corp Returns"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the job responsibilities, requirements, and expectations..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Date
            </label>
            <input
              type="date"
              value={formData.deadline_date}
              onChange={(e) => handleInputChange('deadline_date', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Compensation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payout Type *
            </label>
            <select
              value={formData.payout_type}
              onChange={(e) => handleInputChange('payout_type', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.payout_type ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="fixed">Fixed Amount</option>
              <option value="hourly">Hourly Rate</option>
              <option value="per_return">Per Return</option>
            </select>
            {errors.payout_type && <p className="mt-1 text-sm text-red-600">{errors.payout_type}</p>}
          </div>

          {formData.payout_type === 'fixed' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.payout_fixed}
                  onChange={(e) => handleInputChange('payout_fixed', e.target.value)}
                  className={`w-full border rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.payout_fixed ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.payout_fixed && <p className="mt-1 text-sm text-red-600">{errors.payout_fixed}</p>}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.payout_min}
                    onChange={(e) => handleInputChange('payout_min', e.target.value)}
                    className={`w-full border rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.payout_min ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                {errors.payout_min && <p className="mt-1 text-sm text-red-600">{errors.payout_min}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.payout_max}
                    onChange={(e) => handleInputChange('payout_max', e.target.value)}
                    className={`w-full border rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.payout_max ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                {errors.payout_max && <p className="mt-1 text-sm text-red-600">{errors.payout_max}</p>}
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Terms
            </label>
            <input
              type="text"
              value={formData.payment_terms}
              onChange={(e) => handleInputChange('payment_terms', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Net 7 after acceptance"
            />
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Credentials
            </label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {credentials.map((cred) => (
                <label key={cred.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.credentials_required.includes(cred.value)}
                    onChange={(e) => handleArrayChange('credentials_required', cred.value, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{cred.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Software
            </label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {software.map((soft) => (
                <label key={soft.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.software_required.includes(soft.value)}
                    onChange={(e) => handleArrayChange('software_required', soft.value, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{soft.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specializations
            </label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {specializations.map((spec) => (
                <label key={spec.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialization_keys.includes(spec.value)}
                    onChange={(e) => handleArrayChange('specialization_keys', spec.value, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{spec.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume (Number of Returns)
            </label>
            <input
              type="number"
              value={formData.volume_count}
              onChange={(e) => handleInputChange('volume_count', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 20"
              min="1"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.trial_ok}
                onChange={(e) => handleInputChange('trial_ok', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Trial period available</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              States Where Work/Returns Are Located (Optional)
            </label>
            <select
              multiple
              value={formData.location_states}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                handleInputChange('location_states', selected);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={6}
            >
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple states</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!formData.location_us_only}
                onChange={(e) => handleInputChange('location_us_only', !e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">International</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.insurance_required}
                onChange={(e) => handleInputChange('insurance_required', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Professional liability insurance required</span>
            </label>
          </div>
        </div>
      </div>

      {/* SLA */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Level Agreement (SLA)</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <SLAPreview sla={formData.sla} />
        </div>
        <p className="text-sm text-gray-600">
          The SLA above shows default terms. You can customize these during contract negotiation.
        </p>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/jobs')}
          className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Job'}
        </button>
      </div>
    </form>
  );
}
