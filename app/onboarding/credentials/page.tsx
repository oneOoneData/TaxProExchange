'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import CredentialSection from '@/components/forms/CredentialSection';
import { CredentialType, License } from '@/lib/validations/zodSchemas';

export default function CredentialsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [credentialData, setCredentialData] = useState({
    credential_type: 'Student' as CredentialType,
    licenses: [] as License[]
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const validateCredentials = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate credential type
    if (!credentialData.credential_type) {
      errors.credential_type = 'Please select your credential type';
    }
    
    // Validate licenses for non-Student and non-Other credentials
    if (credentialData.credential_type && 
        credentialData.credential_type !== 'Student' && 
        credentialData.credential_type !== 'Other') {
      
      const validLicenses = credentialData.licenses?.filter(license => 
        license.license_number && 
        license.license_number.trim().length >= 2 && 
        license.issuing_authority && 
        license.issuing_authority.trim().length >= 2
      ) || [];
      
      if (validLicenses.length === 0) {
        errors.license_number = 'License number is required for professional credentials';
      }
      
      // Check if CPA needs state
      if (credentialData.credential_type === 'CPA') {
        credentialData.licenses?.forEach((license, index) => {
          if (!license.state || !license.state.trim()) {
            errors[`license_state_${index}`] = 'State is required for CPA licenses';
          }
        });
      }
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    
    return true;
  };

  const handleNext = async () => {
    // Validate before submitting
    if (!validateCredentials()) {
      setError('Please fix the errors above before continuing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if profile exists first
      const checkResponse = await fetch(`/api/profile?clerk_id=${user.id}`);
      const profileExists = checkResponse.ok;

      let updateData: any;
      
      if (!profileExists) {
        // Create new profile with basic info from Clerk + credentials
        // Use Clerk data or extract from email if not available
        const email = user.primaryEmailAddress?.emailAddress || '';
        const emailPrefix = email.split('@')[0] || 'professional';
        
        updateData = {
          clerk_id: user.id,
          first_name: user.firstName || emailPrefix,
          last_name: user.lastName || 'Professional',
          public_email: email,
          credential_type: credentialData.credential_type,
          licenses: credentialData.licenses,
          // Add required fields for validation
          accepting_work: true,
          public_contact: false,
          works_multistate: false,
          works_international: false,
          countries: [],
          other_software: [],
          specializations: [],
          locations: [],
          software: []
        };
      } else {
        // Update existing profile with credentials only
        updateData = {
          clerk_id: user.id,
          credential_type: credentialData.credential_type,
          licenses: credentialData.licenses
        };
      }
      
      console.log('Sending update data:', updateData);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to save credentials');
      }

      // Redirect to profile edit to complete setup
      router.push('/profile/edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Check if profile exists first
      const checkResponse = await fetch(`/api/profile?clerk_id=${user.id}`);
      const profileExists = checkResponse.ok;

      if (!profileExists) {
        // Create new profile with basic info from Clerk
        // Use Clerk data or extract from email if not available
        const email = user.primaryEmailAddress?.emailAddress || '';
        const emailPrefix = email.split('@')[0] || 'professional';
        
        const createData = {
          clerk_id: user.id,
          first_name: user.firstName || emailPrefix,
          last_name: user.lastName || 'Professional',
          public_email: email,
          credential_type: 'Student', // Default to Student when skipping
          licenses: [],
          accepting_work: true,
          public_contact: false,
          works_multistate: false,
          works_international: false,
          countries: [],
          other_software: [],
          specializations: [],
          locations: [],
          software: []
        };

        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createData),
        });

        if (!response.ok) {
          throw new Error('Failed to create profile');
        }
      }

      // Redirect to profile edit
      router.push('/profile/edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="px-2 py-1 bg-slate-100 rounded-full">Step 1 of 2</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8"
        >
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-4 text-center">
              Professional Credentials
            </h1>
            <p className="text-slate-600 text-center">
              Tell us about your professional credentials. This helps other professionals verify your qualifications.
            </p>
          </div>



          {/* Validation Errors Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-medium text-red-900 mb-1">Please fix the following errors:</h3>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    {Object.entries(validationErrors).map(([key, value]) => (
                      <li key={key}>{value}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Credential Form */}
          <div className="mb-8">
            <CredentialSection
              value={credentialData}
              onChange={(newData) => {
                setCredentialData(newData);
                // Clear validation errors when changing credentials
                const newErrors = { ...validationErrors };
                delete newErrors.credential_type;
                delete newErrors.license_number;
                Object.keys(newErrors).forEach(key => {
                  if (key.startsWith('license_state_')) {
                    delete newErrors[key];
                  }
                });
                setValidationErrors(newErrors);
              }}
              errors={{
                ...validationErrors,
                general: error || undefined
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Complete Profile Setup'
              )}
            </button>
            
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="sm:w-auto px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Skip for Now
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              You can always add or update your credentials later in your profile settings.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
