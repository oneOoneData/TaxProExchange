'use client';

import { useState, useEffect } from 'react';
import { MentorshipPrefs } from '@/lib/types';
import MentorshipTopicPicker from '@/components/MentorshipTopicPicker';

interface MentorshipDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: MentorshipPrefs | null;
  onSave: (preferences: MentorshipPrefs) => Promise<void>;
  type: 'mentor' | 'mentee';
}

// Software options from the profile edit page
const softwareOptions = [
  { slug: 'turbotax', label: 'TurboTax' },
  { slug: 'hr_block', label: 'H&R Block Online' },
  { slug: 'taxact', label: 'TaxAct' },
  { slug: 'taxslayer', label: 'TaxSlayer' },
  { slug: 'freetaxusa', label: 'FreeTaxUSA' },
  { slug: 'cash_app_taxes', label: 'Cash App Taxes' },
  { slug: 'lacerte', label: 'Intuit Lacerte' },
  { slug: 'proseries', label: 'Intuit ProSeries' },
  { slug: 'proconnect', label: 'Intuit ProConnect' },
  { slug: 'drake', label: 'Drake Tax' },
  { slug: 'ultratax', label: 'Thomson Reuters UltraTax CS' },
  { slug: 'cch_axcess', label: 'CCH Axcess Tax' },
  { slug: 'axcess', label: 'Axcess' },
  { slug: 'cch_prosystem', label: 'CCH ProSystem fx Tax' },
  { slug: 'prosystemfx', label: 'ProSystemFX' },
  { slug: 'atx', label: 'ATX' },
  { slug: 'taxwise', label: 'TaxWise' },
  { slug: 'canopy', label: 'Canopy' },
  { slug: 'taxdome', label: 'TaxDome' },
  { slug: 'gosystem_taxrs', label: 'GoSystemTaxRS' },
  { slug: 'mytaxprepoffice', label: 'MyTaxPrepOffice' },
  { slug: 'crosslink', label: 'CrossLink' },
  { slug: 'wg', label: 'WG' },
  { slug: 'corptax', label: 'CSC Corptax' },
  { slug: 'onesource', label: 'Thomson Reuters ONESOURCE' },
  { slug: 'planner', label: 'Thomson Reuters Planner' },
  { slug: 'longview', label: 'Wolters Kluwer Longview Tax' },
  { slug: 'oracle_tax', label: 'Oracle Tax Reporting Cloud' },
  { slug: 'avalara', label: 'Avalara' },
  { slug: 'vertex', label: 'Vertex (O Series)' },
  { slug: 'sovos', label: 'Sovos' },
  { slug: 'taxjar', label: 'TaxJar' },
  { slug: 'stripe_tax', label: 'Stripe Tax' },
  { slug: 'quickbooks_online', label: 'QuickBooks Online' },
  { slug: 'xero', label: 'Xero' },
  { slug: 'freshbooks', label: 'FreshBooks' },
  { slug: 'sage', label: 'Sage' },
  { slug: 'wave', label: 'Wave' },
  { slug: 'adp', label: 'ADP' },
  { slug: 'paychex', label: 'Paychex' },
  { slug: 'gusto', label: 'Gusto' },
  { slug: 'quickbooks_payroll', label: 'QuickBooks Payroll' },
  { slug: 'rippling', label: 'Rippling' },
  { slug: 'track1099', label: 'Track1099' },
  { slug: 'tax1099', label: 'Tax1099 (Zenwork)' },
  { slug: 'yearli', label: 'Yearli (Greatland)' },
  { slug: 'efile4biz', label: 'efile4Biz' },
  { slug: 'cointracker', label: 'CoinTracker' },
  { slug: 'koinly', label: 'Koinly' },
  { slug: 'coinledger', label: 'CoinLedger' },
  { slug: 'taxbit', label: 'TaxBit' },
  { slug: 'zenledger', label: 'ZenLedger' },
  { slug: 'bloomberg_fixed_assets', label: 'Bloomberg Tax Fixed Assets' },
  { slug: 'sage_fixed_assets', label: 'Sage Fixed Assets' },
  { slug: 'cch_fixed_assets', label: 'CCH ProSystem fx Fixed Assets' },
  { slug: 'checkpoint', label: 'Thomson Reuters Checkpoint' },
  { slug: 'cch_intelliconnect', label: 'CCH IntelliConnect' },
  { slug: 'bloomberg_tax', label: 'Bloomberg Tax & Accounting' },
  { slug: 'lexisnexis_tax', label: 'LexisNexis Tax' },
  { slug: 'taxnotes', label: 'TaxNotes' },
  { slug: 'caseware', label: 'CaseWare Working Papers' },
  { slug: 'workiva', label: 'Workiva' },
  { slug: 'sureprep', label: 'SurePrep' },
  { slug: 'cch_workstream', label: 'CCH Axcess Workstream' },
  { slug: 'truss', label: 'Truss' }
];

// Specializations from constants
const specializationOptions = [
  { value: "Individual (Form 1040)", label: "Individual (Form 1040)" },
  { value: "S-Corporation (1120-S)", label: "S-Corporation (1120-S)" },
  { value: "Partnership (1065)", label: "Partnership (1065)" },
  { value: "C-Corporation (1120)", label: "C-Corporation (1120)" },
  { value: "Payroll (941/940)", label: "Payroll (941/940)" },
  { value: "Sales & Excise Returns", label: "Sales & Excise Returns" },
  { value: "Amended Returns", label: "Amended Returns" },
  { value: "IRS Representation", label: "IRS Representation" },
  { value: "1099 Information Reporting", label: "1099 Information Reporting" },
  { value: "Estate Tax (706)", label: "Estate Tax (706)" },
  { value: "Gift Tax (709)", label: "Gift Tax (709)" },
  { value: "Nonprofit (990)", label: "Nonprofit (990)" },
  { value: "Trust & Estate (1041)", label: "Trust & Estate (1041)" },
  { value: "Bookkeeping & Close", label: "Bookkeeping & Close" },
  { value: "Chart of Accounts Design", label: "Chart of Accounts Design" },
  { value: "Inventory & Job Costing", label: "Inventory & Job Costing" },
  { value: "Monthly Close & KPIs", label: "Monthly Close & KPIs" },
  { value: "QBO/Xero Setup & Cleanup", label: "QBO/Xero Setup & Cleanup" },
  { value: "R&D Tax Credits", label: "R&D Tax Credits" },
  { value: "Employee Retention Credit", label: "Employee Retention Credit" },
  { value: "Work Opportunity Tax Credit", label: "Work Opportunity Tax Credit" },
  { value: "Energy Credits", label: "Energy Credits" },
  { value: "State & Local Incentives", label: "State & Local Incentives" },
  { value: "International Tax", label: "International Tax" },
  { value: "Transfer Pricing", label: "Transfer Pricing" },
  { value: "Foreign Bank Account Reporting", label: "Foreign Bank Account Reporting" },
  { value: "Expatriate Tax", label: "Expatriate Tax" },
  { value: "Cryptocurrency Tax", label: "Cryptocurrency Tax" },
  { value: "NFT Tax", label: "NFT Tax" },
  { value: "DeFi Tax", label: "DeFi Tax" },
  { value: "Mining Tax", label: "Mining Tax" },
  { value: "Real Estate Tax", label: "Real Estate Tax" },
  { value: "1031 Exchanges", label: "1031 Exchanges" },
  { value: "Depreciation & Cost Segregation", label: "Depreciation & Cost Segregation" },
  { value: "REITs & Real Estate Funds", label: "REITs & Real Estate Funds" },
  { value: "Practice Management", label: "Practice Management" },
  { value: "Client Acquisition", label: "Client Acquisition" },
  { value: "Pricing & Billing", label: "Pricing & Billing" },
  { value: "Workflow Optimization", label: "Workflow Optimization" },
  { value: "Staff Training", label: "Staff Training" }
];

export default function MentorshipDetailsModal({ 
  isOpen, 
  onClose, 
  preferences, 
  onSave, 
  type 
}: MentorshipDetailsModalProps) {
  const [topics, setTopics] = useState<string[]>(preferences?.topics || []);
  const [software, setSoftware] = useState<string[]>(preferences?.software || []);
  const [specializations, setSpecializations] = useState<string[]>(preferences?.specializations || []);
  const [mentoringMessage, setMentoringMessage] = useState<string>(preferences?.mentoring_message || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (preferences) {
      setTopics(preferences.topics || []);
      setSoftware(preferences.software || []);
      setSpecializations(preferences.specializations || []);
      setMentoringMessage(preferences.mentoring_message || '');
    }
  }, [preferences]);

  const handleSave = async () => {
    if (!preferences) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/mentorship/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topics, 
          software, 
          specializations, 
          mentoring_message: mentoringMessage.trim() || null 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedPreferences = {
          ...preferences,
          topics,
          software,
          specializations,
          mentoring_message: mentoringMessage.trim() || null
        };
        await onSave(updatedPreferences);
        onClose();
      } else {
        console.error('Failed to save mentorship details');
      }
    } catch (error) {
      console.error('Error saving mentorship details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSoftware = (slug: string) => {
    setSoftware(prev => 
      prev.includes(slug) 
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
  };

  const toggleSpecialization = (value: string) => {
    setSpecializations(prev => 
      prev.includes(value) 
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {type === 'mentor' ? 'Mentoring Details' : 'Mentorship Details'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              {type === 'mentor' 
                ? 'What topics would you like to mentor others on?'
                : 'What topics would you like to receive mentorship on?'
              }
            </p>

            {/* Topics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Topics
              </label>
              <MentorshipTopicPicker
                value={topics}
                onChange={setTopics}
              />
            </div>

            {/* Software */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Software Expertise
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {softwareOptions.map(option => (
                  <button
                    key={option.slug}
                    type="button"
                    onClick={() => toggleSoftware(option.slug)}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      software.includes(option.slug) 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Expertise
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {specializationOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSpecialization(option.value)}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      specializations.includes(option.value) 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mentoring Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'mentor' ? 'Mentoring Message' : 'Mentorship Request Message'}
              </label>
              <textarea
                value={mentoringMessage}
                onChange={(e) => setMentoringMessage(e.target.value)}
                placeholder={type === 'mentor' 
                  ? "Tell others what you can help with (e.g., 'I specialize in helping new preparers with ProSeries and S-Corp returns')"
                  : "Tell mentors what you're looking for (e.g., 'I need help understanding cryptocurrency tax reporting and international tax compliance')"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {mentoringMessage.length}/500 characters
              </p>
            </div>

            {(topics.length === 0 && software.length === 0 && specializations.length === 0) && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                Please select at least one topic, software, or specialization to help others find you.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || (topics.length === 0 && software.length === 0 && specializations.length === 0)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
