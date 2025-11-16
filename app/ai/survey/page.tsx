'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import AppNavigation from '@/components/AppNavigation';
import { createClientClient } from '@/lib/supabase/client';

const opportunityOptions = [
  { value: 'workflow_automation', label: 'Automating tax prep & review workflows' },
  { value: 'client_intake', label: 'Streamlining client intake & portals' },
  { value: 'client_communication', label: 'Enhancing client communication & engagement' },
  { value: 'research', label: 'Accelerating tax law & research' },
  { value: 'audit_compliance', label: 'Improving audit & compliance reviews' },
  { value: 'quality_control', label: 'Strengthening quality control & risk management' },
  { value: 'scenario_modeling', label: 'Scaling tax planning & scenario modeling' },
  { value: 'wealth_advisory', label: 'Supporting financial planning & wealth advisory' },
  { value: 'talent', label: 'Upskilling or retaining staff through AI tools' },
];

const barrierOptions = [
  { value: 'data_security', label: 'Client data privacy & security' },
  { value: 'cost', label: 'Budget or ROI concerns' },
  { value: 'training', label: 'Staff training & adoption' },
  { value: 'trust', label: 'Trusting AI outputs' },
  { value: 'regulatory', label: 'Regulatory or compliance uncertainty' },
  { value: 'integrations', label: 'Integrating with existing systems' },
];

const familiarityOptions = [
  { value: '1', label: '1 — Not familiar' },
  { value: '2', label: '2 — Slightly aware' },
  { value: '3', label: '3 — Exploring' },
  { value: '4', label: '4 — Regular users' },
  { value: '5', label: '5 — Advanced' },
];

const currentUseOptions = [
  { value: 'none', label: 'We don’t use AI yet' },
  { value: 'experimenting', label: 'We’re exploring or experimenting (e.g., ChatGPT, Copilot)' },
  { value: 'document_automation', label: 'We use AI for document automation or prep' },
  { value: 'research', label: 'We use AI for research and technical guidance' },
  { value: 'client_comm', label: 'We use AI for client communication or portals' },
  { value: 'forecasting', label: 'We use AI for forecasting or scenario planning' },
  { value: 'other', label: 'Other (tell us more)' },
];

const aiBudgetStatusOptions = [
  { value: 'dedicated', label: 'Dedicated AI budget' },
  { value: 'planning', label: 'Plan to allocate funds' },
  { value: 'exploring', label: 'Exploring but no budget yet' },
  { value: 'no_plans', label: 'No plans to invest' },
];

const aiBudgetRangeOptions = [
  { value: 'under_500', label: 'Under $500', estimate: 250 },
  { value: '500_1000', label: '$500 – $1,000', estimate: 750 },
  { value: '1000_5000', label: '$1,000 – $5,000', estimate: 3000 },
  { value: '5000_15000', label: '$5,000 – $15,000', estimate: 10000 },
  { value: '15000_50000', label: '$15,000 – $50,000', estimate: 32500 },
  { value: 'over_50000', label: 'Over $50,000', estimate: 65000 },
  { value: 'prefer_not', label: 'Prefer not to say', estimate: null },
];

const initialFormState = {
  email: '',
  isAnonymous: false,
  firmName: '',
  state: '',
  country: '',
  role: '',
  firmType: '',
  firmSize: '',
  familiarity: '',
  currentUse: '',
  currentUseOther: '',
  aiBudgetStatus: '',
  aiBudgetRange: '',
  aiOpportunity: [] as string[],
  aiBarriers: [] as string[],
  trustLevel: '',
  futureOutlook: '',
  clientRelationships: '',
  aiAdvice: '',
  socialLink: '',
  sendResultsOptIn: false,
  tpeCommunicationsOptIn: false,
  openToFollowUp: false,
};

const baseSurveySteps = [
  {
    id: 'about',
    title: 'About You',
    subtitle: 'Tell us about your role and firm.',
  },
  {
    id: 'familiarity',
    title: 'AI Familiarity',
    subtitle: 'Gauge your current experience with AI.',
  },
  {
    id: 'budget',
    title: 'Budget & Investment',
    subtitle: 'Capture how you’re funding AI initiatives.',
  },
  {
    id: 'opportunities',
    title: 'Opportunities & Barriers',
    subtitle: 'Choose the areas that matter most to your firm.',
  },
  {
    id: 'future',
    title: 'Future Outlook',
    subtitle: 'Share how you see AI reshaping client work.',
  },
  {
    id: 'contact',
    title: 'Stay in the Loop',
    subtitle: 'Choose how we keep you in the loop.',
  },
] as const;

export default function AiSurveyPage() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClientClient> | null>(null);
  const [hasSupabaseConfig] = useState(
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const surveySteps = useMemo(() => {
    if (formData.isAnonymous) {
      return baseSurveySteps.filter((step) => step.id !== 'contact');
    }
    return baseSurveySteps;
  }, [formData.isAnonymous]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setSupabase(null);
      return;
    }

    const client = createClientClient();
    setSupabase(client);
  }, [hasSupabaseConfig]);

  const updateField = (field: keyof typeof initialFormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleArrayValue = (field: 'aiOpportunity' | 'aiBarriers', value: string) => {
    setFormData((prev) => {
      const current = new Set(prev[field]);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return {
        ...prev,
        [field]: Array.from(current),
      };
    });
  };

  const updateBooleanField = (
    field: 'sendResultsOptIn' | 'tpeCommunicationsOptIn' | 'openToFollowUp',
    value: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      if (!formData.role || !formData.firmType) {
        setError('Please complete your role and firm type to continue.');
        return false;
      }

      if (!formData.isAnonymous) {
        if (!formData.email) {
          setError('Please provide your email to continue.');
          return false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.email)) {
          setError('Please provide a valid email address.');
          return false;
        }
      }
    }

    if (currentStep === 1) {
      if (!formData.familiarity) {
        setError('Let us know your current AI familiarity to continue.');
        return false;
      }
      if (!formData.currentUse) {
        setError('Share where your firm stands with AI to continue.');
        return false;
      }
    }

    setError(null);
    return true;
  };

  const goToNextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, surveySteps.length - 1));
  };

  const goToPreviousStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const {
      email: currentEmail,
      firmName: currentFirmName,
      role: currentRole,
      firmType: currentFirmType,
      isAnonymous: currentIsAnonymous,
    } = formData;

    if (!supabase) {
      if (!hasSupabaseConfig) {
        setError('Survey temporarily unavailable. Supabase credentials are missing.');
      } else {
        setError('Survey temporarily unavailable. Please refresh and try again later.');
      }
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase.from('ai_survey_responses').insert({
        is_anonymous: formData.isAnonymous,
        email: formData.isAnonymous ? null : formData.email,
        firm_name: formData.isAnonymous ? null : formData.firmName || null,
        state: formData.state || null,
        country: formData.country || null,
        role: formData.role,
        firm_type: formData.firmType,
        firm_size: formData.firmSize || null,
        familiarity: formData.familiarity ? Number(formData.familiarity) : null,
        current_use:
          formData.currentUse === 'other'
            ? formData.currentUseOther
              ? `Other: ${formData.currentUseOther}`
              : 'Other'
            : formData.currentUse || null,
        ai_budget_status: formData.aiBudgetStatus || null,
        ai_budget_range: formData.aiBudgetRange || null,
        ai_budget_estimate:
          formData.aiBudgetRange
            ? aiBudgetRangeOptions.find((option) => option.value === formData.aiBudgetRange)?.estimate ?? null
            : null,
        ai_opportunity: formData.aiOpportunity,
        ai_barriers: formData.aiBarriers,
        trust_level: formData.trustLevel ? Number(formData.trustLevel) : null,
        future_outlook: formData.futureOutlook || null,
        client_relationships: formData.clientRelationships || null,
        ai_advice: formData.aiAdvice || null,
        social_link: formData.isAnonymous ? null : formData.socialLink || null,
        send_results_opt_in: formData.isAnonymous ? false : formData.sendResultsOptIn,
        tpe_communications_opt_in: formData.isAnonymous ? false : formData.tpeCommunicationsOptIn,
        open_to_followup: formData.isAnonymous ? false : formData.openToFollowUp,
      });

      if (insertError) {
        throw insertError;
      }

       if (!currentIsAnonymous && currentEmail) {
        try {
          const hubspotResponse = await fetch('/api/hubspot/ai-survey', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: currentEmail,
              firm_name: currentFirmName || '',
              role: currentRole || '',
              firm_type: currentFirmType || '',
            }),
          });

          if (!hubspotResponse.ok) {
            const errorText = await hubspotResponse.text();
            console.error('HubSpot survey sync failed:', hubspotResponse.status, errorText);
          }
        } catch (hubspotError) {
          console.error('HubSpot survey sync exception:', hubspotError);
        }
      }

      setIsSubmitted(true);
      setFormData(initialFormState);
      setCurrentStep(0);
    } catch (submissionError) {
      console.error('Failed to save survey response:', submissionError);
      setError('Something went wrong while saving your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pt-24 pb-20 px-4 sm:px-6">
        <main className="mx-auto w-full max-w-3xl">
          <header className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              AI in Tax & Wealth Firms 2025
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              AI Survey
            </h1>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              Help us map how AI is reshaping tax, wealth, and accounting firms. Your answers will inform the benchmarks we publish for the TaxProExchange community.
            </p>
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-200">About this study:</span> The benchmark is open through{' '}
                <span className="font-medium text-slate-900 dark:text-white">December 31, 2025</span>. We&apos;ll publish findings in January and send participants early access.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
              Complete in under 4 minutes
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 p-4 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span>Your responses stay confidential: only aggregated insights are shared.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>Finish the survey to receive early access to the AI in Tax Firms 2025 results.</span>
                </div>
              </div>
            </div>
          </header>

          {isSubmitted ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-8 text-center shadow-sm dark:border-emerald-500/60 dark:bg-emerald-900/30">
              <h2 className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                Thank you for sharing your perspective!
              </h2>
              <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-200">
                We&apos;ll send the full survey findings to contributors first. Keep an eye on your inbox.
              </p>
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-100">
                If you shared your email, watch for a confirmation message from TaxProExchange (it may land in Promotions or Updates). Confirming ensures we can deliver the full report to you.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
            >
              <div>
                <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>
                    Step {currentStep + 1} of {surveySteps.length}
                  </span>
                  <span>{surveySteps[currentStep].title}</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-blue-600 transition-all dark:bg-blue-400"
                    style={{ width: `${((currentStep + 1) / surveySteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500 dark:bg-red-900/40 dark:text-red-100">
                  {error}
                </div>
              )}

              <section>
                <div className="mb-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">
                    {surveySteps[currentStep].title}
                  </span>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {surveySteps[currentStep].title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {surveySteps[currentStep].subtitle}
                  </p>
                </div>

                {/* Step Content */}
                {currentStep === 0 && (
                  <div className="space-y-5">
                    <div>
                      <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                          checked={formData.isAnonymous}
                          onChange={(event) => {
                            const isAnonymous = event.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              isAnonymous,
                              email: isAnonymous ? '' : prev.email,
                              firmName: isAnonymous ? '' : prev.firmName,
                              socialLink: isAnonymous ? '' : prev.socialLink,
                              sendResultsOptIn: isAnonymous ? false : prev.sendResultsOptIn,
                              tpeCommunicationsOptIn: isAnonymous ? false : prev.tpeCommunicationsOptIn,
                              openToFollowUp: isAnonymous ? false : prev.openToFollowUp,
                            }));
                            const nextStepsLength = isAnonymous
                              ? baseSurveySteps.length - 1
                              : baseSurveySteps.length;
                            setCurrentStep((prev) => Math.min(prev, nextStepsLength - 1));
                          }}
                        />
                        <span>
                          Submit anonymously
                          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            If selected, you won’t be asked for email, firm name, or social links. Your answers will be included anonymously in aggregate results.
                          </span>
                        </span>
                      </label>
                    </div>

                    {!formData.isAnonymous && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Work email<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={updateField('email')}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          placeholder="you@firm.com"
                          required={!formData.isAnonymous}
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Your role<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.role}
                        onChange={updateField('role')}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Select an option</option>
                        <option value="CPA">CPA</option>
                        <option value="Enrolled Agent (EA)">Enrolled Agent (EA)</option>
                        <option value="CTEC / Tax Preparer">CTEC / Tax Preparer</option>
                        <option value="Accountant / Bookkeeper">Accountant / Bookkeeper</option>
                        <option value="Financial Advisor / Planner">Financial Advisor / Planner</option>
                        <option value="Registered Investment Adviser (RIA)">Registered Investment Adviser (RIA)</option>
                        <option value="Firm Owner / Partner">Firm Owner / Partner</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {!formData.isAnonymous && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Firm or team name
                        </label>
                        <input
                          type="text"
                          value={formData.firmName}
                          onChange={updateField('firmName')}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          placeholder="TaxProExchange Advisors"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Firm type<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.firmType}
                        onChange={updateField('firmType')}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        required
                      >
                        <option value="">Select an option</option>
                        <option value="Tax & accounting firm">Tax & accounting firm</option>
                        <option value="Wealth management, financial advisory, or RIA firm">
                          Wealth management, financial advisory, or RIA firm
                        </option>
                        <option value="Multi-service (tax + wealth)">Multi-service (tax + wealth)</option>
                        <option value="Corporate or in-house">Corporate or in-house</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Firm size
                      </label>
                      <select
                        value={formData.firmSize}
                        onChange={updateField('firmSize')}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Select an option</option>
                        <option value="solo">Solo practitioner</option>
                        <option value="2_10">2-10 people</option>
                        <option value="11_50">11-50 people</option>
                        <option value="51_200">51-200 people</option>
                        <option value="201_plus">201+ people</option>
                      </select>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={updateField('state')}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          placeholder="CA, TX, NY…"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={updateField('country')}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <fieldset>
                      <legend className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        How familiar are you or your team with AI tools?<span className="text-red-500">*</span>
                      </legend>
                      <div className="space-y-2">
                        {familiarityOptions.map((option, index) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                          >
                            <input
                              type="radio"
                              name="familiarity"
                              value={option.value}
                              checked={formData.familiarity === option.value}
                              onChange={updateField('familiarity')}
                              required={index === 0 && formData.familiarity === ''}
                              className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Where does your firm currently stand with AI tools?<span className="text-red-500">*</span>
                      </legend>
                      <div className="space-y-2">
                        {currentUseOptions.map((option, index) => (
                          <label
                            key={option.value}
                            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                          >
                            <input
                              type="radio"
                              name="currentUse"
                              value={option.value}
                              checked={formData.currentUse === option.value}
                              onChange={updateField('currentUse')}
                              required={index === 0 && formData.currentUse === ''}
                              className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {formData.currentUse === 'other' && (
                        <input
                          type="text"
                          value={formData.currentUseOther}
                          onChange={updateField('currentUseOther')}
                          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          placeholder="Tell us more about other AI use cases"
                        />
                      )}
                    </fieldset>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <fieldset>
                      <legend className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        What best describes your firm’s 2025 AI budget?
                      </legend>
                      <div className="space-y-2">
                        {aiBudgetStatusOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                          >
                            <input
                              type="radio"
                              name="aiBudgetStatus"
                              value={option.value}
                              checked={formData.aiBudgetStatus === option.value}
                              onChange={updateField('aiBudgetStatus')}
                              className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        About how much do you expect your firm to spend on AI tools or experiments in 2025?
                      </label>
                      <select
                        value={formData.aiBudgetRange}
                        onChange={updateField('aiBudgetRange')}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Select an option</option>
                        {aiBudgetRangeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Biggest AI opportunities
                      </h3>
                      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        Select all that apply.
                      </p>
                      <div className="space-y-3">
                        {opportunityOptions.map((option) => (
                          <label key={option.value} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-200">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                              checked={formData.aiOpportunity.includes(option.value)}
                              onChange={() => toggleArrayValue('aiOpportunity', option.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top barriers</h3>
                      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        Select all that apply.
                      </p>
                      <div className="space-y-3">
                        {barrierOptions.map((option) => (
                          <label key={option.value} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-200">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                              checked={formData.aiBarriers.includes(option.value)}
                              onChange={() => toggleArrayValue('aiBarriers', option.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Trust level in AI recommendations today
                      </label>
                      <select
                        value={formData.trustLevel}
                        onChange={updateField('trustLevel')}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Select a level</option>
                        <option value="0">0% — Not confident yet</option>
                        <option value="25">25% — Trust in narrow cases</option>
                        <option value="50">50% — Trust with human review</option>
                        <option value="75">75% — Trust for most advisory</option>
                        <option value="100">100% — Co-pilot level trust</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Which area will benefit the most from AI in the next 12 months?
                      </label>
                      <textarea
                        value={formData.futureOutlook}
                        onChange={updateField('futureOutlook')}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        placeholder="Advisory services, proactive planning, real-time insights, etc."
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        How will AI change client relationships?
                      </label>
                      <textarea
                        value={formData.clientRelationships}
                        onChange={updateField('clientRelationships')}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        placeholder="Faster communication, personalized planning, deeper insights, etc."
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Advice for peers exploring AI <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Optional)</span>
                      </label>
                      <textarea
                        value={formData.aiAdvice}
                        onChange={updateField('aiAdvice')}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        placeholder="Share lessons learned or recommended first steps."
                      />
                    </div>
                  </div>
                )}

                {surveySteps[currentStep]?.id === 'contact' && !formData.isAnonymous && (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        LinkedIn or social link
                      </label>
                      <input
                        type="url"
                        value={formData.socialLink}
                        onChange={updateField('socialLink')}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        placeholder="https://www.linkedin.com/in/you"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                          checked={formData.openToFollowUp}
                          onChange={() => updateBooleanField('openToFollowUp', !formData.openToFollowUp)}
                        />
                        <span>
                          I&apos;m open to a short follow-up interview or deeper AI use case questionnaire.
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            Great for sharing case studies or testing future tools.
                          </span>
                        </span>
                      </label>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Keep me in the loop</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Choose how we stay in touch once survey insights are ready.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Send me survey results and related insights
                          </span>
                          <div className="mt-2 flex gap-3 text-sm">
                            <button
                              type="button"
                              onClick={() => updateBooleanField('sendResultsOptIn', true)}
                              className={`flex-1 rounded-lg border px-3 py-2 transition ${
                                formData.sendResultsOptIn
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
                                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => updateBooleanField('sendResultsOptIn', false)}
                              className={`flex-1 rounded-lg border px-3 py-2 transition ${
                                !formData.sendResultsOptIn
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
                                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Opt into TaxProExchange product updates & events
                          </span>
                          <div className="mt-2 flex gap-3 text-sm">
                            <button
                              type="button"
                              onClick={() => updateBooleanField('tpeCommunicationsOptIn', true)}
                              className={`flex-1 rounded-lg border px-3 py-2 transition ${
                                formData.tpeCommunicationsOptIn
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
                                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => updateBooleanField('tpeCommunicationsOptIn', false)}
                              className={`flex-1 rounded-lg border px-3 py-2 transition ${
                                !formData.tpeCommunicationsOptIn
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
                                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0 || isSubmitting}
                  className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500"
                >
                  Back
                </button>

                {currentStep === surveySteps.length - 1 ? (
                  <div className="flex flex-col items-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400 dark:focus:ring-offset-slate-900"
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit your response'}
                    </button>
                    <p className="mt-2 text-right text-xs text-slate-500 dark:text-slate-400">
                      We&apos;ll never share individual responses. Aggregated insights only.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    Next
                  </button>
                )}
              </div>
            </form>
          )}
        </main>
      </div>
    </>
  );
}


