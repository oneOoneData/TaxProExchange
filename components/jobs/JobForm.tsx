'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkingExpectationsEditor } from './WorkingExpectationsEditor';
import { jobSchema, type JobFormData } from '@/lib/validations/zodSchemas';

// Remove the old interface - using the one from zodSchemas now

// Remove defaultSLA - using working expectations now

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

// Extended form data type that includes legacy fields
type ExtendedJobFormData = Partial<JobFormData> & {
  // Legacy fields for backward compatibility
  trial_ok?: boolean;
  insurance_required?: boolean;
  location_us_only?: boolean;
  location_countries?: string[];
  remote_ok?: boolean;
  sla?: any;
};

export function JobForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<ExtendedJobFormData>({
    title: '',
    description: '',
    deadline_date: undefined,
    payout_type: 'fixed',
    payout_fixed: undefined,
    payout_min: undefined,
    payout_max: undefined,
    payment_terms: '',
    credentials_required: [],
    software_required: [],
    specialization_keys: [],
    location_states: [],
    volume_count: undefined,
    working_expectations_md: '',
    draft_eta_date: undefined,
    final_review_buffer_days: 3,
    pro_liability_required: false,
    // Legacy fields for backward compatibility
    trial_ok: false,
    insurance_required: false,
    location_us_only: true,
    location_countries: [],
    remote_ok: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ExtendedJobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: keyof ExtendedJobFormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      return {
        ...prev,
        [field]: checked
          ? [...currentArray, value]
          : currentArray.filter(item => item !== value)
      };
    });
  };

  const validateForm = () => {
    try {
      console.log('Validating form data:', formData);
      
      // Basic validation first
      if (!formData.title || formData.title.trim().length < 3) {
        setErrors({ title: 'Job title must be at least 3 characters' });
        return false;
      }
      
      if (!formData.description || formData.description.trim().length < 20) {
        setErrors({ description: 'Job description must be at least 20 characters' });
        return false;
      }
      
      if (formData.payout_type === 'fixed' && !formData.payout_fixed) {
        setErrors({ payout_fixed: 'Fixed amount is required for fixed payout type' });
        return false;
      }
      
      console.log('Basic validation passed');
      setErrors({});
      return true;
    } catch (error: any) {
      console.log('Validation failed:', error);
      setErrors({ submit: 'Validation error occurred' });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    alert('Form submitted! Check console for details.');
    
    if (!validateForm()) {
      console.log('Form validation failed, not submitting');
      return;
    }

    console.log('Form validation passed, submitting...');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        // Convert dates to strings for API
        deadline_date: formData.deadline_date ? new Date(formData.deadline_date).toISOString().split('T')[0] : undefined,
        draft_eta_date: formData.draft_eta_date ? new Date(formData.draft_eta_date).toISOString().split('T')[0] : undefined,
      };
      
      console.log('Submitting data:', submitData);
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Job created successfully:', data);
        router.push(`/jobs/${data.job.id}`);
      } else {
        const errorData = await response.json();
        console.log('API error:', errorData);
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
              value={formData.deadline_date ? new Date(formData.deadline_date).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('deadline_date', e.target.value ? new Date(e.target.value) : undefined)}
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
                  value={formData.payout_fixed || ''}
                  onChange={(e) => handleInputChange('payout_fixed', e.target.value ? parseFloat(e.target.value) : undefined)}
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
                    value={formData.payout_min || ''}
                    onChange={(e) => handleInputChange('payout_min', e.target.value ? parseFloat(e.target.value) : undefined)}
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
                    value={formData.payout_max || ''}
                    onChange={(e) => handleInputChange('payout_max', e.target.value ? parseFloat(e.target.value) : undefined)}
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
                    checked={formData.credentials_required?.includes(cred.value as any) || false}
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
                    checked={formData.software_required?.includes(soft.value) || false}
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
                    checked={formData.specialization_keys?.includes(spec.value) || false}
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
              value={formData.volume_count || ''}
              onChange={(e) => handleInputChange('volume_count', e.target.value ? parseInt(e.target.value) : undefined)}
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
              value={formData.location_states || []}
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

            {/* Professional liability insurance checkbox moved to Working expectations section */}
          </div>
        </div>
      </div>

      {/* Working Expectations */}
      <div>
        <WorkingExpectationsEditor
          value={formData.working_expectations_md || ''}
          onChange={(value) => handleInputChange('working_expectations_md', value)}
          volume={formData.volume_count}
          onDraftEtaChange={(date) => handleInputChange('draft_eta_date', date ? new Date(date) : undefined)}
          onBufferDaysChange={(days) => handleInputChange('final_review_buffer_days', days)}
          onLiabilityChange={(required) => handleInputChange('pro_liability_required', required)}
          draftEtaDate={formData.draft_eta_date ? new Date(formData.draft_eta_date).toISOString().split('T')[0] : undefined}
          bufferDays={formData.final_review_buffer_days || 3}
          liabilityRequired={formData.pro_liability_required || false}
          errors={{
            draftEtaDate: errors.draft_eta_date,
            bufferDays: errors.final_review_buffer_days,
          }}
        />
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
