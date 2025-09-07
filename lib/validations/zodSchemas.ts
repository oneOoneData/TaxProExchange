import { z } from "zod";
import { addBusinessDays } from "@/lib/constants/working-expectations";
import { normalizeUrl, isValidUrl } from '@/lib/utils/url';

// Credential type enum
export const CredentialTypeEnum = z.enum([
  "CPA", 
  "EA", 
  "CTEC", 
  "OR_Tax_Preparer",
  "OR_Tax_Consultant",
  "Student", 
  "Tax Lawyer (JD)", 
  "PTIN Only", 
  "Other"
]);

// License kind enum
export const LicenseKindEnum = z.enum([
  "CPA_STATE_LICENSE", 
  "EA_ENROLLMENT", 
  "CTEC_REG", 
  "OTHER"
]);

// Individual license schema
export const LicenseSchema = z.object({
  license_kind: LicenseKindEnum,
  license_number: z.string().min(2, "License number must be at least 2 characters"),
  issuing_authority: z.string().min(2, "Issuing authority must be at least 2 characters"),
  state: z.string().nullable().optional().refine((val) => !val || val.length === 2, {
    message: "State must be 2 characters or empty"
  }),
  expires_on: z.string().nullable().optional(),
  board_profile_url: z.string().nullable().optional()
    .transform((val) => val ? normalizeUrl(val) : val)
    .refine((val) => !val || val === "" || isValidUrl(val), {
      message: "Must be a valid URL or empty"
    })
}).passthrough(); // Allow additional fields like id, status

// Profile credential schema with validation
export const ProfileCredentialSchema = z.object({
  credential_type: z.union([CredentialTypeEnum, z.literal('')]).refine((val) => val !== '', {
    message: "Please select your professional credential type"
  }),
  licenses: z.array(LicenseSchema).default([])
}).superRefine((val, ctx) => {
  // Students and "Other" credential type don't need licenses
  if (val.credential_type === "Student" || val.credential_type === "Other") return;
  
  const validLicenses = val.licenses?.filter(license => 
    license.license_number && 
    license.license_number.trim().length >= 2 && 
    license.issuing_authority && 
    license.issuing_authority.trim().length >= 2
  ) || [];
  
  // Professional credentials (CPA, EA, CTEC, etc.) must have at least one valid license
  if (validLicenses.length === 0) {
    ctx.addIssue({ 
      code: "custom", 
      message: "At least one valid license is required for professional credentials." 
    });
    return;
  }
  
  // CPA licenses must have a state
  if (val.credential_type === "CPA") {
    validLicenses.forEach((lic, i) => {
      if (!lic.state) {
        ctx.addIssue({ 
          path: ["licenses", i, "state"], 
          code: "custom", 
          message: "State is required for CPA licenses." 
        });
      }
    });
  }
});

// Profile update schema (extends credential schema)
export const ProfileUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required").refine((val) => val !== 'Unknown' && val !== 'New User', {
    message: "Please enter your actual first name"
  }),
  last_name: z.string().min(1, "Last name is required").refine((val) => val !== 'User' && val !== 'New User', {
    message: "Please enter your actual last name"
  }),
  headline: z.string().optional(),
  bio: z.string().optional(),
  opportunities: z.string().optional(),
  firm_name: z.string().optional(),
  public_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website_url: z.string().optional()
    .transform((val) => val ? normalizeUrl(val) : val)
    .refine((val) => !val || val === "" || isValidUrl(val), {
      message: "Must be a valid URL or empty"
    }),
  linkedin_url: z.string().optional()
    .transform((val) => val ? normalizeUrl(val) : val)
    .refine((val) => !val || val === "" || isValidUrl(val), {
      message: "Must be a valid URL or empty"
    }),
  avatar_url: z.string().optional()
    .transform((val) => val ? normalizeUrl(val) : val)
    .refine((val) => !val || val === "" || isValidUrl(val), {
      message: "Must be a valid URL or empty"
    }),
  accepting_work: z.boolean().default(true),
  public_contact: z.boolean().default(false),
  works_multistate: z.boolean().default(false),
  works_international: z.boolean().default(false),
  countries: z.array(z.string()).default([]),
  other_software: z.array(z.string()).default([]),
  email_preferences: z.object({
    frequency: z.enum(["immediate", "daily", "weekly"]).default("immediate"),
    job_notifications: z.boolean().default(true),
    marketing_updates: z.boolean().default(false),
    application_updates: z.boolean().default(true),
    connection_requests: z.boolean().default(true),
    verification_emails: z.boolean().default(true)
  }).optional(),
  primary_location: z.object({
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().default("US"),
    display_name: z.string().nullable().optional()
  }).optional(),
  location_radius: z.number().min(1).max(500).default(50),
  specializations: z.array(z.string()).default([]),
  locations: z.array(z.object({
    state: z.string(),
    city: z.string().optional()
  })).default([]),
  software: z.array(z.string()).default([]),
  years_experience: z.enum(['1-2', '3-5', '6-10', '11-15', '16-20', '21-25', '26-30', '31+']).optional(),
  entity_revenue_range: z.enum(['< $1M', '$1M - $10M', '$10M - $50M', '$50M - $100M', '$100M - $500M', '$500M - $1B', '> $1B']).optional()
}).merge(ProfileCredentialSchema);

// Email preferences update schema (for settings page)
export const EmailPreferencesUpdateSchema = z.object({
  clerk_id: z.string().min(1, "Clerk ID is required"),
  connection_email_notifications: z.boolean().optional(),
  email_preferences: z.object({
    frequency: z.enum(["immediate", "daily", "weekly"]).default("immediate"),
    job_notifications: z.boolean().default(true),
    marketing_updates: z.boolean().default(false),
    application_updates: z.boolean().default(true),
    connection_requests: z.boolean().default(true),
    verification_emails: z.boolean().default(true),
    message_notifications: z.boolean().default(true)
  }).optional()
});

// Onboarding schema (extends profile update with mandatory experience)
export const OnboardingSchema = ProfileUpdateSchema.extend({
  years_experience: z.enum(['1-2', '3-5', '6-10', '11-15', '16-20', '21-25', '26-30', '31+']), // Required for new users
});

// Credential-only update schema (for partial updates)
export const CredentialUpdateSchema = z.object({
  clerk_id: z.string().optional(), // Not part of the profile data itself
  credential_type: z.union([CredentialTypeEnum, z.literal('')]).refine((val) => val !== '', {
    message: "Please select your professional credential type"
  }),
  licenses: z.array(LicenseSchema).default([])
}).superRefine((val, ctx) => {
  // Students and "Other" credential type don't need licenses
  if (val.credential_type === "Student" || val.credential_type === "Other") return;
  
  const validLicenses = val.licenses?.filter(license => 
    license.license_number && 
    license.license_number.trim().length >= 2 && 
    license.issuing_authority && 
    license.issuing_authority.trim().length >= 2
  ) || [];
  
  // Professional credentials (CPA, EA, CTEC, etc.) must have at least one valid license
  if (validLicenses.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "At least one valid license is required for professional credentials."
    });
  }
  if (val.credential_type === "CPA") {
    validLicenses.forEach((lic, i) => {
      if (!lic.state) {
        ctx.addIssue({ 
          path: ["licenses", i, "state"], 
          code: "custom", 
          message: "State is required for CPA licenses." 
        });
      }
    });
  }
});

// Job creation schema
export const jobSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  description: z.string().min(20, "Job description must be at least 20 characters"),
  deadline_date: z.coerce.date().optional(),
  payout_type: z.enum(["fixed", "hourly", "per_return", "discussed"]).default("fixed"),
  payout_fixed: z.coerce.number().nonnegative().optional(),
  payout_min: z.coerce.number().nonnegative().optional(),
  payout_max: z.coerce.number().nonnegative().optional(),
  payment_terms: z.string().optional(),

  credentials_required: z.array(z.enum(["CPA", "EA", "CTEC", "Tax_Lawyer", "PTIN_ONLY"])).optional(),
  software_required: z.array(z.string()).optional(),
  specialization_keys: z.array(z.string()).optional(),
  location_states: z.array(z.string()).optional(),
  volume_count: z.coerce.number().int().nonnegative().optional(),

  working_expectations_md: z.string().max(10000, "Working expectations must be less than 10,000 characters").optional(),
  draft_eta_date: z.coerce.date().optional(),
  final_review_buffer_days: z.coerce.number().int().min(0).max(30).default(3),
  pro_liability_required: z.boolean().default(false),
  free_consultation_required: z.boolean().default(false),
})
.superRefine((data, ctx) => {
  // Validate payout logic
  if (data.payout_type === 'fixed' && !data.payout_fixed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payout_fixed"],
      message: "Fixed payout requires payout_fixed amount",
    });
  }
  if ((data.payout_type === 'hourly' || data.payout_type === 'per_return') && (!data.payout_min || !data.payout_max)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payout_min"],
      message: "Hourly/per_return payout requires min and max amounts",
    });
  }
  if (data.payout_type === 'discussed' && (data.payout_fixed || data.payout_min || data.payout_max)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payout_type"],
      message: "Amount fields should be empty when payout type is 'To be discussed'",
    });
  }
  if (data.payout_min && data.payout_max && data.payout_min > data.payout_max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payout_max"],
      message: "Maximum amount must be greater than minimum amount",
    });
  }

  // Validate deadline buffer: draft_eta_date + buffer_days <= deadline_date
  if (data.deadline_date && data.draft_eta_date && data.final_review_buffer_days != null) {
    const draftPlusBuffer = addBusinessDays(data.draft_eta_date, data.final_review_buffer_days);
    if (draftPlusBuffer > data.deadline_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["draft_eta_date"],
        message: "Draft ETA + review buffer exceeds the deadline. Adjust draft date or buffer.",
      });
    }
  }
});

// Type exports
export type CredentialType = z.infer<typeof CredentialTypeEnum>;
export type LicenseKind = z.infer<typeof LicenseKindEnum>;
export type License = z.infer<typeof LicenseSchema>;
export type ProfileCredential = z.infer<typeof ProfileCredentialSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type CredentialUpdate = z.infer<typeof CredentialUpdateSchema>;
export type JobFormData = z.infer<typeof jobSchema>;
