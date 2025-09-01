import { z } from "zod";

// Credential type enum
export const CredentialTypeEnum = z.enum([
  "CPA", 
  "EA", 
  "CTEC", 
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
  issuing_authority: z.string().min(2, "Issuing authority is required"),
  state: z.string().optional().refine((val) => !val || val.length === 2, {
    message: "State must be 2 characters or empty"
  }),
  expires_on: z.string().optional(),
  board_profile_url: z.string().url("Must be a valid URL").optional().or(z.literal(""))
});

// Profile credential schema with validation
export const ProfileCredentialSchema = z.object({
  credential_type: CredentialTypeEnum,
  licenses: z.array(LicenseSchema).default([])
}).superRefine((val, ctx) => {
  // Students don't need licenses
  if (val.credential_type === "Student") return;
  
  // Non-students must have at least one license
  if (!val.licenses?.length) {
    ctx.addIssue({ 
      code: "custom", 
      message: "At least one license is required for non-students." 
    });
    return;
  }
  
  // CPA licenses must have state
  if (val.credential_type === "CPA") {
    val.licenses.forEach((lic, i) => {
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
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  headline: z.string().optional(),
  bio: z.string().optional(),
  opportunities: z.string().optional(),
  firm_name: z.string().optional(),
  public_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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
  software: z.array(z.string()).default([])
}).merge(ProfileCredentialSchema);

// Credential-only update schema (for partial updates)
export const CredentialUpdateSchema = z.object({
  clerk_id: z.string().optional(), // Not part of the profile data itself
  credential_type: CredentialTypeEnum,
  licenses: z.array(LicenseSchema).default([])
}).superRefine((val, ctx) => {
  if (val.credential_type === "Student") return;
  if (!val.licenses?.length) {
    ctx.addIssue({
      code: "custom",
      message: "At least one license is required for non-students."
    });
  }
  if (val.credential_type === "CPA") {
    val.licenses.forEach((lic, i) => {
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

// Type exports
export type CredentialType = z.infer<typeof CredentialTypeEnum>;
export type LicenseKind = z.infer<typeof LicenseKindEnum>;
export type License = z.infer<typeof LicenseSchema>;
export type ProfileCredential = z.infer<typeof ProfileCredentialSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type CredentialUpdate = z.infer<typeof CredentialUpdateSchema>;
