--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: can_apply_to_jobs(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_apply_to_jobs(user_clerk_id text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE clerk_id = user_clerk_id 
    AND visibility_state = 'verified'
  );
END;
$$;


--
-- Name: can_post_jobs(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_post_jobs(user_clerk_id text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE clerk_id = user_clerk_id 
    AND visibility_state = 'verified' 
    AND firm_name IS NOT NULL
  );
END;
$$;


--
-- Name: clerk_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clerk_user_id() RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'sub','') $$;


--
-- Name: generate_profile_slug(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_profile_slug() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Only generate slug if it's not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Generate base slug
    base_slug := CONCAT(
      LOWER(REGEXP_REPLACE(COALESCE(NEW.first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
      '-',
      LOWER(REGEXP_REPLACE(COALESCE(NEW.last_name, ''), '[^a-zA-Z0-9\s]', '', 'g')),
      '-',
      SUBSTRING(NEW.clerk_id, 1, 8)
    );
    
    -- Ensure uniqueness by adding counter if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != COALESCE(NEW.id, 0)) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  -- Ensure slug is lowercase and clean
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.slug, '[^a-z0-9\s-]', '', 'g'));
  NEW.slug := REGEXP_REPLACE(NEW.slug, '\s+', '-', 'g');
  NEW.slug := REGEXP_REPLACE(NEW.slug, '-+', '-', 'g');
  NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  
  RETURN NEW;
END;
$$;


--
-- Name: get_clerk_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_clerk_user_id() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- This will be set by the Clerk webhook or middleware
    RETURN current_setting('app.clerk_user_id', true);
END;
$$;


--
-- Name: get_my_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_profile() RETURNS TABLE(id uuid, first_name text, last_name text, credential_type text, headline text, bio text, firm_name text, slug text, visibility_state text, is_listed boolean, is_deleted boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.credential_type,
        p.headline,
        p.bio,
        p.firm_name,
        p.slug,
        p.visibility_state,
        p.is_listed,
        p.is_deleted
    FROM profiles p
    WHERE p.clerk_user_id = auth.jwt() ->> 'sub'
      AND p.is_deleted = false;
END;
$$;


--
-- Name: get_profile_by_clerk_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_profile_by_clerk_id(p_clerk_id text) RETURNS TABLE(id uuid, first_name text, last_name text, headline text, bio text, credential_type text, firm_name text, public_email text, phone text, website_url text, linkedin_url text, accepting_work boolean, visibility_state text, is_listed boolean, slug text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.headline,
        p.bio,
        p.credential_type,
        p.firm_name,
        p.public_email,
        p.phone,
        p.website_url,
        p.linkedin_url,
        p.accepting_work,
        p.visibility_state,
        p.is_listed,
        p.slug,
        p.created_at
    FROM profiles p
    WHERE p.clerk_id = p_clerk_id;
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    );
END;
$$;


--
-- Name: restore_profile(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.restore_profile(profile_id uuid, admin_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE profiles 
    SET 
        is_deleted = false,
        deleted_at = NULL,
        deleted_by = NULL,
        visibility_state = 'hidden',
        is_listed = false
    WHERE id = profile_id;
    
    RETURN FOUND;
END;
$$;


--
-- Name: set_license_last4(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_license_last4() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.license_number IS NOT NULL THEN
    NEW.license_last4 := RIGHT(NEW.license_number, 4);
  END IF;
  RETURN NEW;
END $$;


--
-- Name: soft_delete_profile(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.soft_delete_profile(profile_id uuid, admin_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE profiles 
    SET 
        is_deleted = true,
        deleted_at = NOW(),
        deleted_by = admin_id,
        visibility_state = 'hidden',
        is_listed = false
    WHERE id = profile_id;
    
    RETURN FOUND;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: upsert_profile_from_clerk(text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_profile_from_clerk(p_clerk_id text, p_email text, p_first_name text, p_last_name text, p_image_url text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    profile_id UUID;
BEGIN
    INSERT INTO profiles (
        clerk_id,
        email,
        first_name,
        last_name,
        image_url,
        headline,
        credential_type,
        visibility_state,
        is_listed,
        slug
    ) VALUES (
        p_clerk_id,
        p_email,
        p_first_name,
        p_last_name,
        p_image_url,
        COALESCE(p_first_name || ' ' || p_last_name, 'New Professional'),
        'Other',
        'pending',
        false,
        p_clerk_id || '-' || extract(epoch from now())::bigint
    )
    ON CONFLICT (clerk_id) 
    DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        image_url = EXCLUDED.image_url,
        updated_at = NOW()
    RETURNING id INTO profile_id;
    
    RETURN profile_id;
END;
$$;


--
-- Name: validate_milestones_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_milestones_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM jobs_milestones 
    WHERE job_id = NEW.job_id 
    GROUP BY job_id 
    HAVING SUM(release_percent) != 100
  ) THEN
    RAISE EXCEPTION 'Milestones must total 100%% for job %', NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    user_id uuid,
    type text NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


--
-- Name: audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE audits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audits IS 'Audit log for job lifecycle and user actions';


--
-- Name: connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_profile_id uuid NOT NULL,
    recipient_profile_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    stream_channel_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT connections_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    applicant_profile_id uuid NOT NULL,
    applicant_user_id text NOT NULL,
    cover_note text,
    proposed_rate numeric(12,2),
    proposed_payout_type text,
    proposed_timeline text,
    status text DEFAULT 'applied'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    notes text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT job_applications_proposed_payout_type_check CHECK ((proposed_payout_type = ANY (ARRAY['fixed'::text, 'hourly'::text, 'per_return'::text]))),
    CONSTRAINT job_applications_status_check CHECK ((status = ANY (ARRAY['applied'::text, 'shortlisted'::text, 'hired'::text, 'withdrawn'::text, 'rejected'::text, 'completed'::text])))
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    deadline_date date,
    payout_type text NOT NULL,
    payout_fixed numeric(12,2),
    payout_min numeric(12,2),
    payout_max numeric(12,2),
    payment_terms text,
    sla jsonb,
    credentials_required text[] DEFAULT '{}'::text[] NOT NULL,
    software_required text[] DEFAULT '{}'::text[] NOT NULL,
    specialization_keys text[] DEFAULT '{}'::text[] NOT NULL,
    volume_count integer,
    trial_ok boolean DEFAULT false NOT NULL,
    insurance_required boolean DEFAULT false NOT NULL,
    location_us_only boolean DEFAULT true NOT NULL,
    location_states text[] DEFAULT '{}'::text[] NOT NULL,
    location_countries text[] DEFAULT '{}'::text[] NOT NULL,
    remote_ok boolean DEFAULT true NOT NULL,
    assigned_profile_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    sla_version text DEFAULT 'standard_v1'::text,
    sla_overrides jsonb DEFAULT '{}'::jsonb,
    has_escrow boolean DEFAULT false,
    fulfillment_mode text DEFAULT 'fixed'::text,
    compensation_model text DEFAULT 'fixed'::text,
    floor_fixed_cents integer,
    floor_hourly_cents integer,
    start_date date,
    hard_deadline date,
    volume integer,
    trial_available boolean DEFAULT false,
    trial_scope text,
    training_provided boolean DEFAULT false,
    timezones text[],
    security_flags jsonb DEFAULT '{}'::jsonb,
    dispute_policy text,
    pay_items jsonb DEFAULT '[]'::jsonb,
    milestones jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT jobs_compensation_model_check CHECK ((compensation_model = ANY (ARRAY['fixed'::text, 'hourly'::text, 'form_based'::text]))),
    CONSTRAINT jobs_fulfillment_mode_check CHECK ((fulfillment_mode = ANY (ARRAY['fixed'::text, 'shortlist'::text, 'managed'::text]))),
    CONSTRAINT jobs_payout_type_check CHECK ((payout_type = ANY (ARRAY['fixed'::text, 'hourly'::text, 'per_return'::text]))),
    CONSTRAINT jobs_status_check CHECK ((status = ANY (ARRAY['open'::text, 'assigned'::text, 'closed'::text, 'cancelled'::text])))
);


--
-- Name: jobs_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs_milestones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    name text NOT NULL,
    due_offset_days integer NOT NULL,
    release_percent integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT jobs_milestones_release_percent_check CHECK (((release_percent >= 0) AND (release_percent <= 100)))
);


--
-- Name: TABLE jobs_milestones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.jobs_milestones IS 'Milestone tracking for job completion with payment releases';


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    profile_id uuid NOT NULL,
    license_kind text NOT NULL,
    license_number text NOT NULL,
    issuing_authority text NOT NULL,
    state text,
    expires_on date,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    public_mask_pref boolean DEFAULT false NOT NULL,
    license_last4 text,
    board_profile_url text,
    CONSTRAINT licenses_license_kind_check CHECK ((license_kind = ANY (ARRAY['CPA_STATE_LICENSE'::text, 'EA_ENROLLMENT'::text, 'CTEC_REG'::text, 'OTHER'::text]))),
    CONSTRAINT licenses_state_check CHECK ((state ~ '^[A-Z]{2}$'::text)),
    CONSTRAINT licenses_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: licenses_public_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.licenses_public_view AS
 SELECT id,
    profile_id,
    license_kind,
    issuing_authority,
    state,
    expires_on,
    board_profile_url,
    status,
    created_at,
    updated_at,
        CASE
            WHEN (public_mask_pref AND (license_last4 IS NOT NULL)) THEN ('****'::text || license_last4)
            ELSE NULL::text
        END AS masked_display
   FROM public.licenses
  WHERE (status = 'verified'::text);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    country text DEFAULT 'US'::text NOT NULL,
    state text,
    city text,
    CONSTRAINT locations_state_check CHECK ((state ~ '^[A-Z]{2}$'::text))
);


--
-- Name: notification_prefs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_prefs (
    user_id text NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL,
    min_payout numeric(12,2),
    payout_type_filter text[],
    specialization_filter text[],
    states_filter text[],
    international boolean,
    countries_filter text[]
);


--
-- Name: profile_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_locations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    profile_id uuid NOT NULL,
    state text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    city text,
    CONSTRAINT profile_locations_state_check CHECK ((state ~ '^[A-Z]{2}$'::text))
);


--
-- Name: COLUMN profile_locations.city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profile_locations.city IS 'City name for more precise location targeting';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    headline text,
    bio text,
    credential_type text NOT NULL,
    ptin text,
    website_url text,
    linkedin_url text,
    firm_name text,
    phone text,
    public_email text,
    avatar_url text,
    is_listed boolean DEFAULT false NOT NULL,
    visibility_state text DEFAULT 'hidden'::text NOT NULL,
    accepting_work boolean DEFAULT true NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    clerk_id text,
    image_url text,
    email text,
    other_software text[] DEFAULT '{}'::text[],
    onboarding_complete boolean DEFAULT false,
    is_admin boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    clerk_user_id text,
    public_contact boolean DEFAULT false NOT NULL,
    works_multistate boolean DEFAULT false NOT NULL,
    works_international boolean DEFAULT false NOT NULL,
    countries text[] DEFAULT '{}'::text[] NOT NULL,
    tos_version text,
    tos_accepted_at timestamp with time zone,
    privacy_version text,
    privacy_accepted_at timestamp with time zone,
    specializations text[] DEFAULT '{}'::text[],
    states text[] DEFAULT '{}'::text[],
    software text[] DEFAULT '{}'::text[],
    email_preferences jsonb DEFAULT '{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}'::jsonb,
    email_frequency text DEFAULT 'immediate'::text,
    last_email_sent timestamp with time zone,
    primary_location jsonb DEFAULT '{"city": null, "state": null, "country": "US", "display_name": null}'::jsonb,
    location_radius integer DEFAULT 50,
    opportunities text,
    years_experience text,
    entity_revenue_range text,
    CONSTRAINT profiles_credential_type_check CHECK ((credential_type = ANY (ARRAY['CPA'::text, 'EA'::text, 'CTEC'::text, 'Student'::text, 'Tax Lawyer (JD)'::text, 'PTIN Only'::text, 'Other'::text]))),
    CONSTRAINT profiles_email_frequency_check CHECK ((email_frequency = ANY (ARRAY['immediate'::text, 'daily'::text, 'weekly'::text, 'never'::text]))),
    CONSTRAINT profiles_entity_revenue_range_check CHECK ((entity_revenue_range = ANY (ARRAY['< $1M'::text, '$1M - $10M'::text, '$10M - $50M'::text, '$50M - $100M'::text, '$100M - $500M'::text, '$500M - $1B'::text, '> $1B'::text]))),
    CONSTRAINT profiles_slug_format_check CHECK ((slug ~ '^[a-z0-9-]+$'::text)),
    CONSTRAINT profiles_user_or_clerk_id CHECK (((user_id IS NOT NULL) OR (clerk_id IS NOT NULL))),
    CONSTRAINT profiles_visibility_state_check CHECK ((visibility_state = ANY (ARRAY['hidden'::text, 'pending_verification'::text, 'verified'::text, 'rejected'::text]))),
    CONSTRAINT profiles_years_experience_check CHECK ((years_experience = ANY (ARRAY['1-2'::text, '3-5'::text, '6-10'::text, '11-15'::text, '16-20'::text, '21-25'::text, '26-30'::text, '31+'::text])))
);


--
-- Name: COLUMN profiles.public_contact; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.public_contact IS 'Controls whether contact information is visible to unauthenticated users. Defaults to false (private).';


--
-- Name: COLUMN profiles.works_multistate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.works_multistate IS 'When true, professional serves all U.S. states regardless of individual state selections';


--
-- Name: COLUMN profiles.works_international; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.works_international IS 'When true, professional serves international clients';


--
-- Name: COLUMN profiles.countries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.countries IS 'Array of ISO-3166-1 alpha-2 country codes where professional can work internationally';


--
-- Name: COLUMN profiles.tos_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.tos_version IS 'Version of Terms of Use accepted by user';


--
-- Name: COLUMN profiles.tos_accepted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.tos_accepted_at IS 'Timestamp when Terms of Use were accepted';


--
-- Name: COLUMN profiles.privacy_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.privacy_version IS 'Version of Privacy Policy accepted by user';


--
-- Name: COLUMN profiles.privacy_accepted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.privacy_accepted_at IS 'Timestamp when Privacy Policy was accepted';


--
-- Name: COLUMN profiles.email_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.email_preferences IS 'JSON object containing email notification preferences:
{
  "job_notifications": boolean - receive emails about new jobs matching criteria,
  "application_updates": boolean - receive emails about application status changes,
  "connection_requests": boolean - receive emails about new connection requests,
  "verification_emails": boolean - receive emails about verification status,
  "marketing_updates": boolean - receive marketing/newsletter emails,
  "frequency": "immediate" | "daily" | "weekly" | "never"
}';


--
-- Name: COLUMN profiles.email_frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.email_frequency IS 'How often to send non-critical emails (marketing, updates)';


--
-- Name: COLUMN profiles.last_email_sent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.last_email_sent IS 'Timestamp of last email sent for frequency control';


--
-- Name: COLUMN profiles.primary_location; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.primary_location IS 'JSON object containing the main location for display purposes';


--
-- Name: COLUMN profiles.location_radius; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.location_radius IS 'Service radius in miles from primary location';


--
-- Name: COLUMN profiles.opportunities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.opportunities IS 'What opportunities the user is open for and what expertise they are hoping to gain';


--
-- Name: COLUMN profiles.years_experience; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.years_experience IS 'Number of years of experience in tax (mandatory for new users)';


--
-- Name: COLUMN profiles.entity_revenue_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.entity_revenue_range IS 'Average annual revenue of entity clients (optional)';


--
-- Name: profile_locations_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.profile_locations_view AS
 SELECT p.id AS profile_id,
    p.first_name,
    p.last_name,
    p.firm_name,
    p.primary_location,
    p.works_multistate,
    p.works_international,
    p.countries,
    p.location_radius,
    pl.state,
    pl.city,
        CASE
            WHEN p.works_multistate THEN 'All US States'::text
            WHEN p.works_international THEN 'International'::text
            ELSE COALESCE(pl.state, 'Remote'::text)
        END AS service_area
   FROM (public.profiles p
     LEFT JOIN public.profile_locations pl ON ((p.id = pl.profile_id)))
  WHERE ((p.visibility_state = 'verified'::text) AND (p.is_listed = true));


--
-- Name: profile_software; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_software (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    profile_id uuid NOT NULL,
    software_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profile_specializations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_specializations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    profile_id uuid NOT NULL,
    specialization_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pros_saved_searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pros_saved_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    filters_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    notify_email boolean DEFAULT true NOT NULL,
    notify_sms boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE pros_saved_searches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pros_saved_searches IS 'Saved job searches for professionals with notification preferences';


--
-- Name: reviews_firm_by_preparer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews_firm_by_preparer (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    reviewer_user_id text NOT NULL,
    reviewee_user_id text NOT NULL,
    ratings jsonb NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reviews_preparer_by_firm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews_preparer_by_firm (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    reviewer_user_id text NOT NULL,
    reviewee_profile_id uuid NOT NULL,
    ratings jsonb NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    session_token text NOT NULL,
    user_id uuid,
    expires timestamp with time zone NOT NULL
);


--
-- Name: specialization_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialization_groups (
    key text NOT NULL,
    label text NOT NULL
);


--
-- Name: specializations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specializations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    group_key text
);


--
-- Name: user_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_profiles AS
 SELECT id,
    user_id,
    first_name,
    last_name,
    headline,
    bio,
    credential_type,
    ptin,
    website_url,
    linkedin_url,
    firm_name,
    phone,
    public_email,
    avatar_url,
    is_listed,
    visibility_state,
    accepting_work,
    slug,
    created_at,
    updated_at,
    clerk_id,
    COALESCE(clerk_id, (user_id)::text) AS auth_id
   FROM public.profiles p
  WHERE ((clerk_id IS NOT NULL) OR (user_id IS NOT NULL));


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    email text,
    email_verified timestamp with time zone,
    image text
);


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp with time zone NOT NULL
);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: audits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audits (id, actor_id, entity_type, entity_id, action, meta, created_at) FROM stdin;
99c1d5ab-ebfa-4d25-90eb-9a5deb834fc8	8123510e-0b15-46e9-b6d5-f7e1695bdadb	job	0b52411e-d878-49fa-8fd6-4ae0b8310578	job.created	{"job_id": "0b52411e-d878-49fa-8fd6-4ae0b8310578", "has_escrow": false, "fulfillment_mode": "fixed", "compensation_model": "fixed"}	2025-08-29 20:30:06.59574+00
fdea8212-82ed-40fe-a42e-5f37883a2b02	8123510e-0b15-46e9-b6d5-f7e1695bdadb	job	7ffab05b-dfec-459b-910b-6eeb3fc0e39c	job.created	{"job_id": "7ffab05b-dfec-459b-910b-6eeb3fc0e39c", "has_escrow": false, "fulfillment_mode": "fixed", "compensation_model": "fixed"}	2025-08-29 20:32:01.207553+00
\.


--
-- Data for Name: connections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.connections (id, requester_profile_id, recipient_profile_id, status, stream_channel_id, created_at, updated_at) FROM stdin;
79634e14-f0a4-4c1a-9533-7355c64e976b	8123510e-0b15-46e9-b6d5-f7e1695bdadb	069988ff-7336-4f47-bc0c-7850ba72285f	pending	\N	2025-08-31 04:13:44.315871+00	2025-08-31 04:13:44.315871+00
0c1ff4f5-4c60-4c9e-9547-e573af5e7758	8123510e-0b15-46e9-b6d5-f7e1695bdadb	8123510e-0b15-46e9-b6d5-f7e1695bdadb	pending	\N	2025-08-31 04:15:47.422106+00	2025-08-31 04:15:47.422106+00
69e2f6a4-6fc9-4f81-9f4e-aa29812a74f6	8fc33f51-43af-4bab-9516-fd31b5d9dcab	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	pending	\N	2025-09-01 22:16:36.797968+00	2025-09-01 22:16:36.797968+00
6dc713cb-185b-4e5e-833e-be2f671ef23c	8fc33f51-43af-4bab-9516-fd31b5d9dcab	58236c15-a9d8-4e5b-9b79-1c3415bbec57	pending	\N	2025-09-01 22:17:26.360056+00	2025-09-01 22:17:26.360056+00
\.


--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_applications (id, job_id, applicant_profile_id, applicant_user_id, cover_note, proposed_rate, proposed_payout_type, proposed_timeline, status, created_at, notes, updated_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, created_by, title, description, status, deadline_date, payout_type, payout_fixed, payout_min, payout_max, payment_terms, sla, credentials_required, software_required, specialization_keys, volume_count, trial_ok, insurance_required, location_us_only, location_states, location_countries, remote_ok, assigned_profile_id, created_at, sla_version, sla_overrides, has_escrow, fulfillment_mode, compensation_model, floor_fixed_cents, floor_hourly_cents, start_date, hard_deadline, volume, trial_available, trial_scope, training_provided, timezones, security_flags, dispute_policy, pay_items, milestones) FROM stdin;
24755971-cdab-4ab6-a223-10062de9cf63	user_31vbRPusrbzss2XTqCjveAMIkq8	NEW JOB	\nNEW JOB\n	cancelled	2025-08-29	fixed	222.00	\N	\N		{"dispute": "If scope creep, pause work and request change in writing", "security": "No unmasked PII in chat; use platform storage", "data_exchange": "Portal-only (no email attachments)", "response_time_hours": 24, "draft_turnaround_days": 5, "revision_rounds_included": 1}	{}	{}	{real_estate}	\N	f	f	t	{}	{}	t	\N	2025-08-29 23:10:39.839647+00	standard_v1	{}	f	fixed	fixed	\N	\N	\N	\N	\N	f	\N	f	\N	{}	\N	[]	[]
c4e7fdc9-ced9-4144-b7ce-5d503ec0e7b4	user_31vbRPusrbzss2XTqCjveAMIkq8	JOB TITLE	JOB TITLEJOB TITLEJOB TITLEJOB TITLEv	cancelled	2025-08-30	fixed	300.00	\N	\N		{"dispute": "If scope creep, pause work and request change in writing", "security": "No unmasked PII in chat; use platform storage", "data_exchange": "Portal-only (no email attachments)", "response_time_hours": 24, "draft_turnaround_days": 5, "revision_rounds_included": 1}	{}	{}	{s_corp}	\N	f	f	t	{}	{}	t	\N	2025-08-29 23:05:47.623467+00	standard_v1	{}	f	fixed	fixed	\N	\N	\N	\N	\N	f	\N	f	\N	{}	\N	[]	[]
7ffab05b-dfec-459b-910b-6eeb3fc0e39c	user_31vbRPusrbzss2XTqCjveAMIkq8	TEST JOB	TEST JOBTEST JOBTEST JOBTEST JOB	cancelled	2025-08-30	fixed	300.00	\N	\N		{"version": "standard_v1", "overrides": {}}	{}	{}	{}	\N	f	f	t	{}	{}	t	\N	2025-08-29 20:32:01.132687+00	standard_v1	{}	f	fixed	fixed	30000	\N	2025-08-30	2025-08-30	\N	f	\N	f	\N	{}	\N	[]	[]
0b52411e-d878-49fa-8fd6-4ae0b8310578	user_31vbRPusrbzss2XTqCjveAMIkq8	TEST JOB	TEST JOBTEST JOBTEST JOBTEST JOBTEST JOBTEST JOB	cancelled	2025-08-23	fixed	300.00	\N	\N		{"version": "standard_v1", "overrides": {}}	{}	{}	{}	\N	f	f	t	{}	{}	t	\N	2025-08-29 20:30:06.475894+00	standard_v1	{}	f	fixed	fixed	30000	\N	2025-08-23	2025-08-23	\N	f	\N	f	\N	{}	\N	[]	[]
\.


--
-- Data for Name: jobs_milestones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs_milestones (id, job_id, name, due_offset_days, release_percent, created_at) FROM stdin;
\.


--
-- Data for Name: licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licenses (id, profile_id, license_kind, license_number, issuing_authority, state, expires_on, status, notes, created_at, updated_at, public_mask_pref, license_last4, board_profile_url) FROM stdin;
c26c8f71-9b61-45cc-8188-0e2f9a36d9b1	a7df637f-5ba4-42a7-a84a-15b6c45fed00	EA_ENROLLMENT	00158556	IRS	\N	2026-03-31	verified	\N	2025-09-02 02:35:29.255664+00	2025-09-02 04:39:56.022431+00	f	8556	\N
7a27699b-e9d6-40f4-bc28-b56cdac4987f	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	CPA_STATE_LICENSE	35506	State Board of Accountancy	VA	\N	verified	\N	2025-09-02 16:17:47.788836+00	2025-09-02 16:40:58.529889+00	f	5506	https://cpaportal.boa.virginia.gov/Verification/Search.aspx
aba0a08f-638e-4a0e-9b53-5108305b6492	c8ed3e7c-1a2b-4a91-a5a8-b6318ea94280	EA_ENROLLMENT	00163085-EA	IRS	\N	\N	verified	\N	2025-09-02 17:43:22.478419+00	2025-09-02 17:55:07.738036+00	f	5-EA	\N
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, country, state, city) FROM stdin;
22c40d3f-9a43-40d0-a5a7-cf86bb2cd9a2	US	CA	Los Angeles
5a5e6ad6-c96b-4bc7-a9a1-6ae865b52578	US	CA	San Francisco
748e296c-1b5d-43e1-95a1-76927a518c05	US	NY	New York
36fe5487-e915-437b-8083-b7b92de515a0	US	TX	Houston
967caad7-5dd2-4054-be0b-2cf75a3e43db	US	TX	Dallas
28487115-b85e-4835-97ad-1c681bf17594	US	FL	Miami
b5691211-bb98-478a-81b1-73e68324be79	US	IL	Chicago
\.


--
-- Data for Name: notification_prefs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_prefs (user_id, email_enabled, sms_enabled, min_payout, payout_type_filter, specialization_filter, states_filter, international, countries_filter) FROM stdin;
\.


--
-- Data for Name: profile_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profile_locations (id, profile_id, state, created_at, city) FROM stdin;
634bedca-213c-4c26-9812-8416bc1f9bc8	1cb2f657-4610-458a-99fc-acf7506c2c6d	CA	2025-08-29 16:30:45.008332+00	\N
e95ee56a-2999-4de4-b30e-5f8f87ed4214	0334c0b3-2d26-4547-80e2-465d5139e88a	AL	2025-08-29 03:58:34.979197+00	\N
e5ddec8e-562e-40cd-9f15-0b54a0617414	0334c0b3-2d26-4547-80e2-465d5139e88a	AK	2025-08-29 03:58:34.979197+00	\N
3718832f-e52a-41b4-adf3-ae216961980a	0334c0b3-2d26-4547-80e2-465d5139e88a	AZ	2025-08-29 03:58:34.979197+00	\N
e35c1205-8ffb-4415-9021-fc5e165dddb3	0334c0b3-2d26-4547-80e2-465d5139e88a	AR	2025-08-29 03:58:34.979197+00	\N
3d8ede8c-5625-4f8e-b282-da3392f10625	0334c0b3-2d26-4547-80e2-465d5139e88a	CO	2025-08-29 03:58:34.979197+00	\N
7832a213-0084-4ffa-b747-efa26ed6a953	0334c0b3-2d26-4547-80e2-465d5139e88a	CT	2025-08-29 03:58:34.979197+00	\N
c5cdf973-b0b9-4617-8df6-d57b1e95bdb1	0334c0b3-2d26-4547-80e2-465d5139e88a	DE	2025-08-29 03:58:34.979197+00	\N
a150150c-988b-4a7e-b715-1537dec75a2a	0334c0b3-2d26-4547-80e2-465d5139e88a	FL	2025-08-29 03:58:34.979197+00	\N
00dcbe2f-a72b-4982-beb9-100d7aedc960	0334c0b3-2d26-4547-80e2-465d5139e88a	GA	2025-08-29 03:58:34.979197+00	\N
ddd1ed5a-1072-4280-98cd-c403d1ab1492	0334c0b3-2d26-4547-80e2-465d5139e88a	HI	2025-08-29 03:58:34.979197+00	\N
9774229a-0697-4c9e-a505-133d2c1c5bf6	0334c0b3-2d26-4547-80e2-465d5139e88a	ID	2025-08-29 03:58:34.979197+00	\N
44b6364d-a249-4fc6-81bc-45adc7bb9d18	0334c0b3-2d26-4547-80e2-465d5139e88a	IL	2025-08-29 03:58:34.979197+00	\N
ddbc0d5e-29f3-4c95-8e41-f9063246dbba	0334c0b3-2d26-4547-80e2-465d5139e88a	IN	2025-08-29 03:58:34.979197+00	\N
5ef88786-263b-45f9-ae72-8c1678ee4d38	0334c0b3-2d26-4547-80e2-465d5139e88a	IA	2025-08-29 03:58:34.979197+00	\N
086e4551-38c2-4a0e-b9a9-1fe1bf62782e	0334c0b3-2d26-4547-80e2-465d5139e88a	KS	2025-08-29 03:58:34.979197+00	\N
a83fbe19-7a22-4798-9e65-14a66efb62a3	0334c0b3-2d26-4547-80e2-465d5139e88a	KY	2025-08-29 03:58:34.979197+00	\N
c31a8e3b-6b8a-46b4-b136-72efd061ec3e	0334c0b3-2d26-4547-80e2-465d5139e88a	LA	2025-08-29 03:58:34.979197+00	\N
8919fb9a-c7a2-49f8-9a11-f92683e7a7ac	0334c0b3-2d26-4547-80e2-465d5139e88a	ME	2025-08-29 03:58:34.979197+00	\N
4ea47c76-6d51-44d8-830b-c2651a367b1c	0334c0b3-2d26-4547-80e2-465d5139e88a	MD	2025-08-29 03:58:34.979197+00	\N
14d0cc70-f793-4acc-b62c-4184caf642e5	0334c0b3-2d26-4547-80e2-465d5139e88a	MA	2025-08-29 03:58:34.979197+00	\N
07699499-d6c4-4910-b91d-75318143e689	0334c0b3-2d26-4547-80e2-465d5139e88a	MS	2025-08-29 03:58:34.979197+00	\N
c331a17b-977f-4947-8488-b568e2782e7f	0334c0b3-2d26-4547-80e2-465d5139e88a	MN	2025-08-29 03:58:34.979197+00	\N
5432f11d-9acb-4767-b165-15c261fb60ab	0334c0b3-2d26-4547-80e2-465d5139e88a	MI	2025-08-29 03:58:34.979197+00	\N
7834117b-9738-4064-813c-dc183a603a8a	0334c0b3-2d26-4547-80e2-465d5139e88a	MO	2025-08-29 03:58:34.979197+00	\N
b87375dc-6815-4ba1-a23a-44fcb73d29f5	0334c0b3-2d26-4547-80e2-465d5139e88a	MT	2025-08-29 03:58:34.979197+00	\N
bd5525b5-1a6a-4056-a2b7-5db8f0bcf235	0334c0b3-2d26-4547-80e2-465d5139e88a	NE	2025-08-29 03:58:34.979197+00	\N
3e33eb85-d2b7-4b4e-b420-a0238224af9d	0334c0b3-2d26-4547-80e2-465d5139e88a	NJ	2025-08-29 03:58:34.979197+00	\N
84d1c8bc-205c-4cc0-8fe3-1a845665a49c	0334c0b3-2d26-4547-80e2-465d5139e88a	NH	2025-08-29 03:58:34.979197+00	\N
49abfa76-1d9b-42b6-9b20-2049fabc3034	0334c0b3-2d26-4547-80e2-465d5139e88a	NV	2025-08-29 03:58:34.979197+00	\N
d6a97fb9-3ff4-4611-bc46-1339241173a4	0334c0b3-2d26-4547-80e2-465d5139e88a	NM	2025-08-29 03:58:34.979197+00	\N
255dd00d-9704-4e8e-8ce6-edf10966fe9c	0334c0b3-2d26-4547-80e2-465d5139e88a	NY	2025-08-29 03:58:34.979197+00	\N
92c612f2-346c-4683-9991-5822fe4dcc2d	0334c0b3-2d26-4547-80e2-465d5139e88a	NC	2025-08-29 03:58:34.979197+00	\N
e4292a99-144a-47fe-a07e-5a465b4b7226	0334c0b3-2d26-4547-80e2-465d5139e88a	ND	2025-08-29 03:58:34.979197+00	\N
418c8d1a-a0e0-441f-b173-1ac922526ea6	0334c0b3-2d26-4547-80e2-465d5139e88a	OH	2025-08-29 03:58:34.979197+00	\N
847a571f-7a92-4eab-97ca-cc495b388c77	0334c0b3-2d26-4547-80e2-465d5139e88a	OK	2025-08-29 03:58:34.979197+00	\N
67dc2b9c-9336-46be-9860-b5dff4722fd9	0334c0b3-2d26-4547-80e2-465d5139e88a	PA	2025-08-29 03:58:34.979197+00	\N
c021e72f-56cc-4fd5-8f78-3e8499e68765	4cddbda4-80c1-4615-9724-226eecbdb911	AL	2025-08-29 03:07:39.361368+00	\N
072229ff-2875-4550-8d62-c3db8a97e218	4cddbda4-80c1-4615-9724-226eecbdb911	AK	2025-08-29 03:07:39.361368+00	\N
3558770c-c11a-4840-88a6-10ff685e1a90	0334c0b3-2d26-4547-80e2-465d5139e88a	RI	2025-08-29 03:58:34.979197+00	\N
db27cfd7-6303-4259-803b-ebcd6b211a4b	0334c0b3-2d26-4547-80e2-465d5139e88a	SC	2025-08-29 03:58:34.979197+00	\N
7d5d94de-3c47-4957-811b-e852bfeaca86	0334c0b3-2d26-4547-80e2-465d5139e88a	SD	2025-08-29 03:58:34.979197+00	\N
07fd81c3-c4b2-4015-a01f-e101950f51d5	0334c0b3-2d26-4547-80e2-465d5139e88a	TN	2025-08-29 03:58:34.979197+00	\N
1e4c415e-c713-4fda-83c5-afcecb8befe8	0334c0b3-2d26-4547-80e2-465d5139e88a	VT	2025-08-29 03:58:34.979197+00	\N
2a8c305e-269b-4212-a2ff-62d2637648fa	0334c0b3-2d26-4547-80e2-465d5139e88a	UT	2025-08-29 03:58:34.979197+00	\N
73a0b1b5-c7d8-4253-8644-a69aa6c95bd9	0334c0b3-2d26-4547-80e2-465d5139e88a	TX	2025-08-29 03:58:34.979197+00	\N
20656a1c-8907-43f1-8af5-155ab2ffdad4	0334c0b3-2d26-4547-80e2-465d5139e88a	VA	2025-08-29 03:58:34.979197+00	\N
e2e133dc-a347-4652-889e-44e779c661da	0334c0b3-2d26-4547-80e2-465d5139e88a	WA	2025-08-29 03:58:34.979197+00	\N
6d181430-e30d-4939-af20-1c091375d904	0334c0b3-2d26-4547-80e2-465d5139e88a	WV	2025-08-29 03:58:34.979197+00	\N
aabceeab-c8cb-4e93-b653-166a3030c9f6	0334c0b3-2d26-4547-80e2-465d5139e88a	WY	2025-08-29 03:58:34.979197+00	\N
7920be66-bc23-4f4e-a4ec-675e2e5ea39f	0334c0b3-2d26-4547-80e2-465d5139e88a	WI	2025-08-29 03:58:34.979197+00	\N
cc4833d7-a03a-4017-bb50-857520d821c0	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	NY	2025-08-30 10:32:32.506712+00	\N
cc9233bf-1192-4a8c-ab59-22a0137d7566	069988ff-7336-4f47-bc0c-7850ba72285f	MO	2025-08-30 16:53:40.039402+00	\N
3fa038b4-d88b-49fe-aa5f-dfcf7ffee484	d4e9fc32-7de4-4614-b2e1-69700c5fe93f	CA	2025-08-30 20:35:57.04908+00	\N
3dcdd332-8dbb-40d4-8709-5a6d79c7f6d4	44e38eb2-5c51-433e-94c5-13e59a34e81c	AZ	2025-08-31 17:54:55.341078+00	\N
be28b1e0-a4ac-4b09-a572-5ada5d312ba9	44e38eb2-5c51-433e-94c5-13e59a34e81c	CA	2025-08-31 17:54:55.341078+00	\N
3832079b-d2c0-482e-929a-ffafc3364cec	44e38eb2-5c51-433e-94c5-13e59a34e81c	CO	2025-08-31 17:54:55.341078+00	\N
7f35df6f-6eb5-448a-909d-41f3a8789480	44e38eb2-5c51-433e-94c5-13e59a34e81c	FL	2025-08-31 17:54:55.341078+00	\N
663246f6-5a3a-4ca1-961c-9e8b55f0f7d6	44e38eb2-5c51-433e-94c5-13e59a34e81c	NV	2025-08-31 17:54:55.341078+00	\N
b8bbb6c1-f7c6-43e5-95aa-980328ca8dc2	44e38eb2-5c51-433e-94c5-13e59a34e81c	NY	2025-08-31 17:54:55.341078+00	\N
57b4b0ce-7ae8-4954-9541-b404c90224ba	44e38eb2-5c51-433e-94c5-13e59a34e81c	MA	2025-08-31 17:54:55.341078+00	\N
cd2ccf26-9877-49dd-9b60-1987863c9f56	44e38eb2-5c51-433e-94c5-13e59a34e81c	NC	2025-08-31 17:54:55.341078+00	\N
a17b5bab-84f6-4777-bf05-dd8d04768ddb	4cddbda4-80c1-4615-9724-226eecbdb911	AZ	2025-08-29 03:07:39.361368+00	\N
17155689-3cfb-4a02-b653-253fcbd8841a	4cddbda4-80c1-4615-9724-226eecbdb911	AR	2025-08-29 03:07:39.361368+00	\N
e8678c9f-3404-42dd-b729-57d9df8ad6d7	4cddbda4-80c1-4615-9724-226eecbdb911	CO	2025-08-29 03:07:39.361368+00	\N
87c5c391-296a-4814-a567-6c0ace3bd846	4cddbda4-80c1-4615-9724-226eecbdb911	CA	2025-08-29 03:07:39.361368+00	\N
97f104af-1c6c-4c4b-8ea4-f6ac04e91a00	4cddbda4-80c1-4615-9724-226eecbdb911	DE	2025-08-29 03:07:39.361368+00	\N
ae793d56-37bc-4f25-9e4a-8b2288d60315	4cddbda4-80c1-4615-9724-226eecbdb911	FL	2025-08-29 03:07:39.361368+00	\N
2de8cac9-d671-4350-8dd6-5e81dff748b6	4cddbda4-80c1-4615-9724-226eecbdb911	CT	2025-08-29 03:07:39.361368+00	\N
1b1e98da-200d-4c1e-96db-3f0351decf5b	4cddbda4-80c1-4615-9724-226eecbdb911	GA	2025-08-29 03:07:39.361368+00	\N
40e751f5-d0e5-4cc3-840f-41be9fc53714	4cddbda4-80c1-4615-9724-226eecbdb911	HI	2025-08-29 03:07:39.361368+00	\N
ea14deed-e9c8-4fb9-b3b5-9cc9f0e9b530	4cddbda4-80c1-4615-9724-226eecbdb911	ID	2025-08-29 03:07:39.361368+00	\N
83ad1cd3-a172-46d8-96f9-b0fcb7709048	4cddbda4-80c1-4615-9724-226eecbdb911	IA	2025-08-29 03:07:39.361368+00	\N
eca9c754-fa1c-4d38-ac50-bf4750ec6f66	4cddbda4-80c1-4615-9724-226eecbdb911	IN	2025-08-29 03:07:39.361368+00	\N
2ab4fe92-583e-4520-b667-7d818add4314	4cddbda4-80c1-4615-9724-226eecbdb911	IL	2025-08-29 03:07:39.361368+00	\N
f021c748-35ef-4e25-9a84-aa5446795169	4cddbda4-80c1-4615-9724-226eecbdb911	KS	2025-08-29 03:07:39.361368+00	\N
572fd7d1-3ef7-4d4b-b61c-ec48cf6b29f1	4cddbda4-80c1-4615-9724-226eecbdb911	KY	2025-08-29 03:07:39.361368+00	\N
6c973bb0-3c59-4599-81af-e25fc0040367	4cddbda4-80c1-4615-9724-226eecbdb911	LA	2025-08-29 03:07:39.361368+00	\N
cc204f35-e677-45e0-ab6e-d3a5f9a98652	4cddbda4-80c1-4615-9724-226eecbdb911	MA	2025-08-29 03:07:39.361368+00	\N
2deb3464-a8e8-405a-bb05-f9c919cc7c6a	4cddbda4-80c1-4615-9724-226eecbdb911	ME	2025-08-29 03:07:39.361368+00	\N
1df83084-5e9f-4bb0-a857-982ac08c14b4	4cddbda4-80c1-4615-9724-226eecbdb911	MD	2025-08-29 03:07:39.361368+00	\N
ac51a1ee-2d83-42cb-b240-d1e055f2183d	4cddbda4-80c1-4615-9724-226eecbdb911	MS	2025-08-29 03:07:39.361368+00	\N
1867d571-f348-41d4-8f56-1cba28af4a90	4cddbda4-80c1-4615-9724-226eecbdb911	MN	2025-08-29 03:07:39.361368+00	\N
031e29a2-1076-49b9-b124-9ee98b708ef7	4cddbda4-80c1-4615-9724-226eecbdb911	MI	2025-08-29 03:07:39.361368+00	\N
1127028a-4d42-4d95-9f9b-b0507a151895	4cddbda4-80c1-4615-9724-226eecbdb911	MO	2025-08-29 03:07:39.361368+00	\N
a42e211e-16f9-4855-981e-1f8eb7967dba	4cddbda4-80c1-4615-9724-226eecbdb911	MT	2025-08-29 03:07:39.361368+00	\N
27516490-23b1-4dba-a731-58f3a4b3df6b	4cddbda4-80c1-4615-9724-226eecbdb911	NE	2025-08-29 03:07:39.361368+00	\N
df5efa8e-4b00-45c1-9668-f617e81a315d	4cddbda4-80c1-4615-9724-226eecbdb911	NJ	2025-08-29 03:07:39.361368+00	\N
63728d73-ee50-4c4f-a355-e65c3471a321	4cddbda4-80c1-4615-9724-226eecbdb911	NH	2025-08-29 03:07:39.361368+00	\N
f35714d1-7dcb-448f-9dd3-8c393f5060c1	4cddbda4-80c1-4615-9724-226eecbdb911	NV	2025-08-29 03:07:39.361368+00	\N
5fac5928-f868-497e-b914-b9729618b0cb	4cddbda4-80c1-4615-9724-226eecbdb911	NC	2025-08-29 03:07:39.361368+00	\N
67c80c6e-4d17-4a77-974d-c5c740c41f96	4cddbda4-80c1-4615-9724-226eecbdb911	NM	2025-08-29 03:07:39.361368+00	\N
e291e0a8-0328-4082-83a8-b0c6b0ad517b	4cddbda4-80c1-4615-9724-226eecbdb911	ND	2025-08-29 03:07:39.361368+00	\N
c9118d42-6a9b-44e0-a252-1707a54eee2f	4cddbda4-80c1-4615-9724-226eecbdb911	OK	2025-08-29 03:07:39.361368+00	\N
6cb8d536-263b-458e-99b0-d684f899dffe	4cddbda4-80c1-4615-9724-226eecbdb911	OR	2025-08-29 03:07:39.361368+00	\N
e6647a3c-7c9f-46b7-b272-d6c814250f0c	4cddbda4-80c1-4615-9724-226eecbdb911	RI	2025-08-29 03:07:39.361368+00	\N
084fdcce-7498-4ab0-abcc-e796dbb1b2ee	4cddbda4-80c1-4615-9724-226eecbdb911	NY	2025-08-29 03:07:39.361368+00	\N
5132564a-25a7-4ad3-82d0-ccd0aaab05e1	4cddbda4-80c1-4615-9724-226eecbdb911	OH	2025-08-29 03:07:39.361368+00	\N
386b1d09-a29a-42b1-b402-d4a05599eb8c	4cddbda4-80c1-4615-9724-226eecbdb911	PA	2025-08-29 03:07:39.361368+00	\N
38242dda-ca4c-4b78-8502-4b597db04743	4cddbda4-80c1-4615-9724-226eecbdb911	TN	2025-08-29 03:07:39.361368+00	\N
fe56a889-46d0-46eb-8268-16301a1579a3	4cddbda4-80c1-4615-9724-226eecbdb911	SD	2025-08-29 03:07:39.361368+00	\N
b3b5f4a2-23c6-4a5d-b397-47a3d1fd83c0	4cddbda4-80c1-4615-9724-226eecbdb911	SC	2025-08-29 03:07:39.361368+00	\N
636ada8a-0855-4942-b623-1d1c4cbfcf71	4cddbda4-80c1-4615-9724-226eecbdb911	VT	2025-08-29 03:07:39.361368+00	\N
01647f14-1974-4555-9dea-8e87e6b6efa0	4cddbda4-80c1-4615-9724-226eecbdb911	WV	2025-08-29 03:07:39.361368+00	\N
db20868e-8bf8-460a-8814-a87afa2f9f88	4cddbda4-80c1-4615-9724-226eecbdb911	WY	2025-08-29 03:07:39.361368+00	\N
5388ab6e-8e95-4d20-9fc1-c0a6780a1af5	4cddbda4-80c1-4615-9724-226eecbdb911	WI	2025-08-29 03:07:39.361368+00	\N
1b178afa-337e-497e-9c14-d8b4e0a9181e	4cddbda4-80c1-4615-9724-226eecbdb911	WA	2025-08-29 03:07:39.361368+00	\N
ba17b852-3ec2-43aa-b020-a34e37c662ca	4cddbda4-80c1-4615-9724-226eecbdb911	TX	2025-08-29 03:07:39.361368+00	\N
c4ff3a21-9b21-422f-86bc-10eeae898761	4cddbda4-80c1-4615-9724-226eecbdb911	UT	2025-08-29 03:07:39.361368+00	\N
c8ec7195-9d8e-437f-88e7-bbe296641e74	4cddbda4-80c1-4615-9724-226eecbdb911	VA	2025-08-29 03:07:39.361368+00	\N
949dd5b0-c505-4b01-b2ec-bf30e58f9f61	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	AK	2025-08-29 18:00:02.563611+00	\N
a6e16068-2528-4234-abea-17d965af18d1	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	AL	2025-08-29 18:00:02.563611+00	\N
22767726-cf59-4256-8168-fba27e1b173a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	AR	2025-08-29 18:00:02.563611+00	\N
add085f2-6d28-4c3c-90ae-e28e5c969229	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	AZ	2025-08-29 18:00:02.563611+00	\N
afeda00f-ae85-43d1-b90b-2f8c1fdbe809	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	CO	2025-08-29 18:00:02.563611+00	\N
b1300977-8158-4132-8be0-9c0252d322ac	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	CT	2025-08-29 18:00:02.563611+00	\N
a2539a17-f466-4add-bd4e-fab47ac4ef84	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	DE	2025-08-29 18:00:02.563611+00	\N
e5aabbd0-9502-4233-9891-9fd9f42c4f22	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	FL	2025-08-29 18:00:02.563611+00	\N
374179d0-02e8-4c5b-94c4-7bf4f82a8c3b	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	GA	2025-08-29 18:00:02.563611+00	\N
1c058a52-07ef-425b-a948-d84eca5f6e8a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	HI	2025-08-29 18:00:02.563611+00	\N
5dfe8454-f167-437d-846d-8171e16d1aa0	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	IA	2025-08-29 18:00:02.563611+00	\N
b6c6205e-efcb-4660-bf9a-c71d1f472180	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	ID	2025-08-29 18:00:02.563611+00	\N
6f3dd263-7f1c-4c38-86e3-dd5831632d72	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	IL	2025-08-29 18:00:02.563611+00	\N
ef90e8ff-d840-4cea-9924-334c67142a9a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	IN	2025-08-29 18:00:02.563611+00	\N
7c3d3e7b-566d-40dd-9b37-a2ccfaa8213e	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	KS	2025-08-29 18:00:02.563611+00	\N
85fcce99-c46d-477d-a475-8901e6a713e1	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	KY	2025-08-29 18:00:02.563611+00	\N
1259cb4d-72e7-4472-b14c-9cf2f25d0428	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	LA	2025-08-29 18:00:02.563611+00	\N
3ee34681-d2be-475b-898f-a1b25a793b8e	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	MA	2025-08-29 18:00:02.563611+00	\N
a78b74f5-279b-4767-94ef-f6af2b8e29b3	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	MD	2025-08-29 18:00:02.563611+00	\N
d529780e-520f-44c7-85eb-d8a636ae130b	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	ME	2025-08-29 18:00:02.563611+00	\N
888770a8-69f7-42af-a35c-d84269fd35ea	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	MI	2025-08-29 18:00:02.563611+00	\N
270e051d-6b5d-4f38-9568-3a85689208cf	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	MN	2025-08-29 18:00:02.563611+00	\N
fc86da9a-6d9e-4d40-b4b1-62ceb0481e9a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	MO	2025-08-29 18:00:02.563611+00	\N
b4fb94e1-3ca8-45a1-baaf-f25f435da05b	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	MS	2025-08-29 18:00:02.563611+00	\N
5b270232-013a-4159-86a9-2854b4030432	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	MT	2025-08-29 18:00:02.563611+00	\N
184ec8c9-2de2-40c2-ad20-1cefd3d8bdbe	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	NC	2025-08-29 18:00:02.563611+00	\N
0d2d779b-3419-4f67-895a-1ea01225a2be	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	ND	2025-08-29 18:00:02.563611+00	\N
a2dfcbf8-87fd-4f8e-841a-f32e0e19a0a7	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	NE	2025-08-29 18:00:02.563611+00	\N
977e0d5b-5d7f-48fa-8a26-953b1d6e16ac	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	NH	2025-08-29 18:00:02.563611+00	\N
3d7fcddc-08fa-4d82-b787-b34934d9a90a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	NJ	2025-08-29 18:00:02.563611+00	\N
059265a0-1697-4241-912a-655cb388994c	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	NM	2025-08-29 18:00:02.563611+00	\N
a240ce17-f87f-4c34-9116-42b77d020ab3	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	NV	2025-08-29 18:00:02.563611+00	\N
5be9cef0-74d9-4769-93c2-16618ebdf10a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	OK	2025-08-29 18:00:02.563611+00	\N
4f138ffd-25f0-4dba-b914-1b1140316318	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	OR	2025-08-29 18:00:02.563611+00	\N
83d7f2b6-f0a5-4e23-b77a-35b514e36059	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	RI	2025-08-29 18:00:02.563611+00	\N
9a661709-3bde-4e7c-9d9b-e90cd7837bd9	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	SC	2025-08-29 18:00:02.563611+00	\N
ceecac94-0340-4e31-ba2f-477bcdf30ccd	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	SD	2025-08-29 18:00:02.563611+00	\N
3a1dc397-e26f-4351-8168-66fd51e3373d	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	TN	2025-08-29 18:00:02.563611+00	\N
b07c7310-94bf-48b2-9696-4ae06d24d579	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	TX	2025-08-29 18:00:02.563611+00	\N
e643ed59-d52b-47ac-b800-4d4bd7d23011	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	UT	2025-08-29 18:00:02.563611+00	\N
9757c3cb-87c0-4f88-9094-f627f36c00a9	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	VA	2025-08-29 18:00:02.563611+00	\N
080cb3c9-18cb-4936-b0c0-f8d6e906695b	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	VT	2025-08-29 18:00:02.563611+00	\N
341eeed7-fa33-4550-bb6d-54b1a64df7b7	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	WA	2025-08-29 18:00:02.563611+00	\N
4eee0520-0119-47f5-a4cd-d66f84b2dd6b	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	WI	2025-08-29 18:00:02.563611+00	\N
06765cfa-1438-4689-a007-79a716dac762	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	WV	2025-08-29 18:00:02.563611+00	\N
107732c8-e132-4a2c-b3b9-d99de3bc7941	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	WY	2025-08-29 18:00:02.563611+00	\N
cd7cb9b4-5aed-4522-b534-24b87297c004	8123510e-0b15-46e9-b6d5-f7e1695bdadb	AK	2025-08-29 23:28:11.849804+00	\N
976fdc23-2032-4022-ae2e-30d612221ca0	8123510e-0b15-46e9-b6d5-f7e1695bdadb	AL	2025-08-29 23:28:11.849804+00	\N
3b70ef8e-7a8d-4152-927d-5923a2bc2884	8123510e-0b15-46e9-b6d5-f7e1695bdadb	AZ	2025-08-29 23:28:11.849804+00	\N
e5c8d734-10e5-4a4f-84c4-7b7a4e9ae505	8123510e-0b15-46e9-b6d5-f7e1695bdadb	CO	2025-08-29 23:28:11.849804+00	\N
7403f7ff-c432-45b0-8c13-d635d825fb28	8123510e-0b15-46e9-b6d5-f7e1695bdadb	TX	2025-08-29 23:28:11.849804+00	\N
bacf9e44-6312-488f-9958-02ed3a86e377	8123510e-0b15-46e9-b6d5-f7e1695bdadb	UT	2025-08-29 23:28:11.849804+00	\N
\.


--
-- Data for Name: profile_software; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profile_software (id, profile_id, software_slug, created_at) FROM stdin;
f898224e-8716-412e-a5c7-94b51aef491e	0334c0b3-2d26-4547-80e2-465d5139e88a	taxact	2025-08-29 03:58:35.464968+00
89f0cd02-5e28-4d7e-aecf-2e9205cc2aae	0334c0b3-2d26-4547-80e2-465d5139e88a	drake_tax	2025-08-29 03:58:35.464968+00
304df2cb-5cd1-4ae4-b825-ced436038b85	0334c0b3-2d26-4547-80e2-465d5139e88a	canopy	2025-08-29 03:58:35.464968+00
f2fada77-d46a-4805-9424-908fb54f1d81	0334c0b3-2d26-4547-80e2-465d5139e88a	taxdome	2025-08-29 03:58:35.464968+00
c45d94c3-d629-46d7-a6e8-b24e0f5f397e	0334c0b3-2d26-4547-80e2-465d5139e88a	adp	2025-08-29 03:58:35.464968+00
a97491b2-f6b7-4d25-951d-6da8ba5faa81	0334c0b3-2d26-4547-80e2-465d5139e88a	gusto	2025-08-29 03:58:35.464968+00
d2ad94f6-7abc-43ce-8b65-e0c8898705df	0334c0b3-2d26-4547-80e2-465d5139e88a	yearli	2025-08-29 03:58:35.464968+00
8efeb7f1-0172-4d7d-a550-5175e542f6d1	0334c0b3-2d26-4547-80e2-465d5139e88a	efile4biz	2025-08-29 03:58:35.464968+00
4d7f11f0-3499-488a-84b6-f25ccaf6f0f6	0334c0b3-2d26-4547-80e2-465d5139e88a	zenledger	2025-08-29 03:58:35.464968+00
5fb7ff30-f137-400e-bd10-5446b220ac31	0334c0b3-2d26-4547-80e2-465d5139e88a	cch_intelliconnect	2025-08-29 03:58:35.464968+00
d0fd3ff0-81ab-47e2-98e8-29e5f49cf557	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	cch_prosystem	2025-09-01 10:55:40.462531+00
4f5b5234-e5a8-4633-8b32-336484d2602f	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	corptax	2025-09-01 10:55:40.462531+00
5e1a9b5b-1143-4ce9-b555-bf2e9287bd1e	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	taxact	2025-09-01 10:55:40.462531+00
f2e67daf-bbb3-4880-b734-55459b2d4a60	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	taxdome	2025-09-01 10:55:40.462531+00
8ea548c3-f9d4-4396-b3e7-cbaa34bd4da5	58236c15-a9d8-4e5b-9b79-1c3415bbec57	proseries	2025-09-01 15:10:49.273515+00
3699d25b-1c6a-43b3-b1dd-c88e941c834e	58236c15-a9d8-4e5b-9b79-1c3415bbec57	cch_axcess	2025-09-01 15:10:49.273515+00
30988a42-9f3b-48ce-a394-5dbf7527e830	58236c15-a9d8-4e5b-9b79-1c3415bbec57	lacerte	2025-09-01 15:10:49.273515+00
c91e8d9b-5edb-4c52-b2a5-e4236f110a29	58236c15-a9d8-4e5b-9b79-1c3415bbec57	turbotax	2025-09-01 15:10:49.273515+00
45abeade-f3a5-4fc8-b0e0-fad5247a2de4	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	drake_tax	2025-09-01 16:56:34.866364+00
1a89e65a-65ff-40b9-8a68-479a535b768d	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	ultratax	2025-09-01 16:56:34.866364+00
1fc023bf-be21-4ccd-84ab-7a0d9dd77303	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	cch_axcess	2025-09-01 16:56:34.866364+00
212d0023-bacf-4d51-a0e5-d1115caeb97a	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	cch_prosystem	2025-09-01 16:56:34.866364+00
0d486d78-ae3b-4948-a2f2-ddda73962500	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	taxdome	2025-09-01 16:56:34.866364+00
a9aaf9bb-8c56-4efc-a2fb-1d21179b4670	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	canopy	2025-09-01 16:56:34.866364+00
6e6c52ca-9f51-49cf-8744-63ae398ef23a	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	adp	2025-09-01 16:56:34.866364+00
3ddb56d3-42ee-4c48-be3a-ffe5f6fe4766	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	cch_intelliconnect	2025-09-01 16:56:34.866364+00
27cb682f-634d-47da-ae05-995e20231027	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	sureprep	2025-09-01 16:56:34.866364+00
b8a75a64-44c5-46d8-ba1d-28ece1c9f7e6	1cb2f657-4610-458a-99fc-acf7506c2c6d	proseries	2025-08-29 16:30:45.520698+00
b498a49c-edff-470a-a497-3ba983a8e3c1	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	taxslayer	2025-08-29 18:00:03.055904+00
0028aa7c-d251-48de-b927-675ae46f0574	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	ultratax	2025-09-01 16:59:50.024335+00
226fdac5-976c-4117-bc5e-30f8f98004da	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	cch_axcess	2025-09-01 16:59:50.024335+00
10b4c40f-df2a-46dc-a0b4-ec34fbd4c809	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	yearli	2025-09-01 16:59:50.024335+00
fe1efe19-ddb9-4050-926b-80b00c74db03	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	cch_intelliconnect	2025-09-01 16:59:50.024335+00
dbfd2715-1a2d-4778-b2e5-151105d9085d	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	ultratax	2025-08-29 18:00:03.055904+00
f9a5b7f7-55e4-4e64-a18d-9b8afe2d01fd	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	cch_axcess	2025-08-29 18:00:03.055904+00
23ffd593-e8e2-4892-a170-fa4fea1d5745	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	gusto	2025-08-29 18:00:03.055904+00
d355be21-cd7d-4c1a-94c1-577b1b20ad0a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	adp	2025-08-29 18:00:03.055904+00
6477ff22-c7df-478b-a6ad-7981fb22b144	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	quickbooks_payroll	2025-08-29 18:00:03.055904+00
784d6ac1-780e-4eda-98be-559a7ab4a1e8	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	taxdome	2025-08-29 18:00:03.055904+00
a094413f-bc4f-4aef-87f2-15036aabc18e	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	caseware	2025-08-29 18:00:03.055904+00
8470cccf-c8f5-4c3c-8187-402484c8a031	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	checkpoint	2025-09-01 16:59:50.024335+00
9c3f15c9-0d46-4026-841e-89289e3022b2	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	bloomberg_tax	2025-09-01 16:59:50.024335+00
2120f48e-5fb3-4139-8d33-187c3cb28993	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	sureprep	2025-09-01 16:59:50.024335+00
f3e97e2a-13bd-4180-ae0d-daffe11c298a	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	cch_workstream	2025-09-01 16:59:50.024335+00
30788ae9-33ac-40c6-a742-024b0322159b	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	cch_fixed_assets	2025-09-01 16:59:50.024335+00
97e43fba-ba53-4d76-a328-d1c6fed68734	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	quickbooks_payroll	2025-09-01 16:59:50.024335+00
a92f5947-3340-4fca-ba2d-efd6fa72fde8	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	lacerte	2025-09-01 16:59:50.024335+00
74643fb7-f4e7-448a-b5b0-50cea3f8a7a7	f5003bd9-d1a2-4164-adb4-3cd70c6995e9	hr_block	2025-09-01 17:45:33.076866+00
5565057d-4dc4-4666-9635-6af1ac8db755	f5003bd9-d1a2-4164-adb4-3cd70c6995e9	freetaxusa	2025-09-01 17:45:33.076866+00
c0682aca-619d-45d1-bc85-dcb096862de1	8fc33f51-43af-4bab-9516-fd31b5d9dcab	lacerte	2025-09-01 22:21:47.381155+00
56e414c7-aaeb-4826-bf12-292b9cdaa2b3	a7df637f-5ba4-42a7-a84a-15b6c45fed00	drake_tax	2025-09-02 02:35:28.905236+00
9b360e21-c51b-40a6-bc4c-1c4cca575e49	a7df637f-5ba4-42a7-a84a-15b6c45fed00	taxnotes	2025-09-02 02:35:28.905236+00
d37f0ebc-55ef-41bc-886d-9a5db3832b26	a7df637f-5ba4-42a7-a84a-15b6c45fed00	taxdome	2025-09-02 02:35:28.905236+00
0c5c9bfb-9028-454f-ba49-7e18442384d0	a7df637f-5ba4-42a7-a84a-15b6c45fed00	turbotax	2025-09-02 02:35:28.905236+00
04e278bf-f9dd-44a3-bc47-2948f88635fb	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	drake_tax	2025-09-02 16:17:47.174133+00
f9677aa6-8ada-489a-8b6b-00c3c24c0eb0	069988ff-7336-4f47-bc0c-7850ba72285f	cch_axcess	2025-08-30 16:53:40.405786+00
662f823f-e35b-4357-8972-4c7c1d47db98	069988ff-7336-4f47-bc0c-7850ba72285f	canopy	2025-08-30 16:53:40.405786+00
eee38199-95ef-4d2c-abf7-89cef34ac9f8	069988ff-7336-4f47-bc0c-7850ba72285f	cch_intelliconnect	2025-08-30 16:53:40.405786+00
faa4d293-5844-465d-906c-fd71fde6f122	d4e9fc32-7de4-4614-b2e1-69700c5fe93f	drake_tax	2025-08-30 20:35:57.428739+00
6f96d13c-f097-446e-a402-0b1d0699b40e	44e38eb2-5c51-433e-94c5-13e59a34e81c	cch_axcess	2025-08-31 17:54:55.739693+00
96075f1e-de93-414d-a022-9981421f4eb0	44e38eb2-5c51-433e-94c5-13e59a34e81c	cch_prosystem	2025-08-31 17:54:55.739693+00
e72b3e65-ab7b-4ed9-a12b-8e6da8ea19e5	44e38eb2-5c51-433e-94c5-13e59a34e81c	taxdome	2025-08-31 17:54:55.739693+00
8f940698-2487-4af0-88a7-9ecb7b6eb0f7	44e38eb2-5c51-433e-94c5-13e59a34e81c	checkpoint	2025-08-31 17:54:55.739693+00
98b9f30b-6148-460a-8583-32af5eb2f9b4	44e38eb2-5c51-433e-94c5-13e59a34e81c	cch_intelliconnect	2025-08-31 17:54:55.739693+00
ffad1eb3-527b-4120-bb48-0572730b6df9	44e38eb2-5c51-433e-94c5-13e59a34e81c	bloomberg_tax	2025-08-31 17:54:55.739693+00
b79cbb64-6556-4ea4-9a5a-bd4194d484d4	44e38eb2-5c51-433e-94c5-13e59a34e81c	quickbooks_payroll	2025-08-31 17:54:55.739693+00
3ff9d02f-952f-4b9d-b846-197c1e1c15d4	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	cch_axcess	2025-09-02 16:17:47.174133+00
3dc197cb-0bd8-4ea5-90ed-f32862f06979	4cddbda4-80c1-4615-9724-226eecbdb911	taxact	2025-08-29 03:07:39.721009+00
d622cb36-8048-419e-a0ef-143b46ca5168	4cddbda4-80c1-4615-9724-226eecbdb911	freetaxusa	2025-08-29 03:07:39.721009+00
59a028f1-396d-499d-a735-51604f30a6e4	4cddbda4-80c1-4615-9724-226eecbdb911	hr_block	2025-08-29 03:07:39.721009+00
595f7a01-a159-494d-ac2b-60d35e4334c9	4cddbda4-80c1-4615-9724-226eecbdb911	turbotax	2025-08-29 03:07:39.721009+00
f6cc1d93-8928-4680-976f-e2f6924eb911	4cddbda4-80c1-4615-9724-226eecbdb911	lacerte	2025-08-29 03:07:39.721009+00
898ac703-4a35-46f0-bfa7-4d043645567a	4cddbda4-80c1-4615-9724-226eecbdb911	drake_tax	2025-08-29 03:07:39.721009+00
d369369e-95eb-44e9-bb07-00b794c004ec	4cddbda4-80c1-4615-9724-226eecbdb911	ultratax	2025-08-29 03:07:39.721009+00
7e770f44-4b54-45d9-9f23-c3a28435170f	4cddbda4-80c1-4615-9724-226eecbdb911	cch_axcess	2025-08-29 03:07:39.721009+00
833f1bf6-8ee2-4a56-a35f-e61fd4bac0f7	4cddbda4-80c1-4615-9724-226eecbdb911	taxwise	2025-08-29 03:07:39.721009+00
1c320d57-0037-4524-89af-d86c7bd8aa5a	4cddbda4-80c1-4615-9724-226eecbdb911	canopy	2025-08-29 03:07:39.721009+00
d87e392f-8abd-475c-9034-e2dbfe8c110f	4cddbda4-80c1-4615-9724-226eecbdb911	taxdome	2025-08-29 03:07:39.721009+00
fc312158-7494-43fb-a931-1936d5f5f2f2	4cddbda4-80c1-4615-9724-226eecbdb911	adp	2025-08-29 03:07:39.721009+00
fdeb894f-60c4-45bf-9881-386a3656df54	4cddbda4-80c1-4615-9724-226eecbdb911	gusto	2025-08-29 03:07:39.721009+00
385b58ee-1967-4463-8b9c-aae7234a2f06	4cddbda4-80c1-4615-9724-226eecbdb911	quickbooks_payroll	2025-08-29 03:07:39.721009+00
106324ab-9af8-4b11-a460-5c31ed084290	4cddbda4-80c1-4615-9724-226eecbdb911	track1099	2025-08-29 03:07:39.721009+00
96bf4e0d-abff-4118-add8-bdc20e6acdbd	4cddbda4-80c1-4615-9724-226eecbdb911	tax1099	2025-08-29 03:07:39.721009+00
2a79dc5d-6fe5-411a-bf6f-13bb27172a96	4cddbda4-80c1-4615-9724-226eecbdb911	checkpoint	2025-08-29 03:07:39.721009+00
bd925973-a6e2-4d02-94d4-9d4411b32395	4cddbda4-80c1-4615-9724-226eecbdb911	cch_intelliconnect	2025-08-29 03:07:39.721009+00
4a8887b0-dfee-406f-b611-6d094a34cbd1	31290bd3-f403-4d32-9b76-f85f34f8e02b	drake_tax	2025-08-31 23:25:29.597078+00
097facc9-93e8-43ce-ad4e-9e65aff743c4	31290bd3-f403-4d32-9b76-f85f34f8e02b	ultratax	2025-08-31 23:25:29.597078+00
ede19127-ace7-4bad-b774-6b57e7af5fd0	9bf599de-ebc6-44a9-bead-c26989ef9bab	taxact	2025-09-01 00:25:12.436603+00
67766b8c-3ff3-4c3c-b425-950fde50e6a8	9bf599de-ebc6-44a9-bead-c26989ef9bab	drake_tax	2025-09-01 00:25:12.436603+00
1316c77f-41f3-49f0-b2eb-8a0397412f82	9bf599de-ebc6-44a9-bead-c26989ef9bab	taxdome	2025-09-01 00:25:12.436603+00
81b45746-b197-4605-a75e-2668a8f31db6	9bf599de-ebc6-44a9-bead-c26989ef9bab	adp	2025-09-01 00:25:12.436603+00
44cfcb15-0b0b-4607-aa10-32d96c056408	9bf599de-ebc6-44a9-bead-c26989ef9bab	paychex	2025-09-01 00:25:12.436603+00
51915e00-647e-4f3d-8315-78c5e2c17e2e	9bf599de-ebc6-44a9-bead-c26989ef9bab	quickbooks_payroll	2025-09-01 00:25:12.436603+00
ef38c74d-c9be-4cc8-b965-5214ff49b8a4	9bf599de-ebc6-44a9-bead-c26989ef9bab	hr_block	2025-09-01 00:25:12.436603+00
0efb2243-74cb-4067-932d-45de114e5aa8	9bf599de-ebc6-44a9-bead-c26989ef9bab	freetaxusa	2025-09-01 00:25:12.436603+00
9c13a878-27d9-4441-8516-725dac3428e6	9bf599de-ebc6-44a9-bead-c26989ef9bab	gusto	2025-09-01 00:25:12.436603+00
1851403a-fe22-41d9-8bd6-e7114f900cd7	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	atx	2025-09-02 16:17:47.174133+00
ec626ecc-96b3-445b-a226-9d18c7d20e44	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	canopy	2025-09-02 16:17:47.174133+00
daf92f99-92c8-4805-8343-770d83a7ef15	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	taxdome	2025-09-02 16:17:47.174133+00
c2de4800-8c77-4aad-81d9-a79808a85f04	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	proseries	2025-09-02 16:17:47.174133+00
5763dc50-3778-4407-9044-25966d1f5b84	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	taxslayer	2025-09-02 16:17:47.174133+00
a661010f-5d69-4f67-aa62-dcfb3b407c4b	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	lacerte	2025-09-02 16:17:47.174133+00
86572dae-bd00-4971-97da-6f314d008dc6	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	quickbooks_payroll	2025-09-02 16:17:47.174133+00
fc048a07-fb52-4d93-b9f6-b792528aae21	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	hr_block	2025-09-02 16:17:47.174133+00
c8f7e948-afaf-46bb-879e-fe6b9e9e724e	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	taxact	2025-09-02 16:17:47.174133+00
c00ef54a-495b-4426-be79-8b70b70838e9	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	turbotax	2025-09-02 16:17:47.174133+00
7281f72a-a770-4d10-a265-d2d6fe06dcd0	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	stripe_tax	2025-09-02 16:17:47.174133+00
7308dd18-5944-4634-b5c3-5de822924759	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	rippling	2025-09-02 16:17:47.174133+00
a703ae92-7dd4-4b80-8f1d-14e5409ee9e3	8123510e-0b15-46e9-b6d5-f7e1695bdadb	proseries	2025-09-03 03:01:56.310315+00
356091ae-0f47-49d3-ad99-5c35aa1a8593	8123510e-0b15-46e9-b6d5-f7e1695bdadb	taxdome	2025-09-03 03:01:56.310315+00
\.


--
-- Data for Name: profile_specializations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profile_specializations (id, profile_id, specialization_slug, created_at) FROM stdin;
55adcb8c-110a-4d61-8042-5a67847ac4ca	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	1065_partnership	2025-09-01 10:55:39.877455+00
aa8ad65c-2c83-460f-a48b-02724140aeae	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	1120_c_corp	2025-09-01 10:55:39.877455+00
4d68a5ef-6dd6-472c-86ae-e5b73171d64c	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	1120s_s_corp	2025-09-01 10:55:39.877455+00
ea35f68b-b02e-4c92-a7d9-4bd81c4b82c2	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	8858_disregarded_foreign	2025-09-01 10:55:39.877455+00
9e71af85-d883-47d5-9496-1fb3d7a30a21	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	business	2025-09-01 10:55:39.877455+00
02a7026e-ea6e-4e51-9587-3120eef8d8f5	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	irs_rep	2025-09-01 10:55:39.877455+00
99727db0-c824-4bee-a644-1cc736705338	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	irs_rep_exams_audits	2025-09-01 10:55:39.877455+00
34dd6962-b56a-42e5-91a6-09d4bd16a04a	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	multi_state	2025-09-01 10:55:39.877455+00
3cacb773-40b7-4fa5-942f-455ec2c78ea2	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	multistate_apportionment	2025-09-01 10:55:39.877455+00
063643a5-acbd-4703-b973-bef8660054aa	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	notice_response_cp_letters	2025-09-01 10:55:39.877455+00
a5609eb1-d90d-4917-95ab-b3944a85dce7	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	partnership	2025-09-01 10:55:39.877455+00
026050a4-5077-4b61-bb1d-7d6d371cf10d	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	r_and_d_credit_6765	2025-09-01 10:55:39.877455+00
7974270c-402d-4dc1-83b2-5faeced4a349	c31ac9cb-f828-48f0-882f-bb428e8e8cf8	s_corp	2025-09-01 10:55:39.877455+00
f2635969-9dd8-43e1-a652-4216dcc966eb	58236c15-a9d8-4e5b-9b79-1c3415bbec57	Individual (Form 1040)	2025-09-01 15:10:48.766624+00
02f8145a-663a-442f-bb6a-ead4f67efe38	58236c15-a9d8-4e5b-9b79-1c3415bbec57	S-Corporation (1120-S)	2025-09-01 15:10:48.766624+00
5f758133-decf-49cd-a7bc-c468cdd34268	58236c15-a9d8-4e5b-9b79-1c3415bbec57	Partnership (1065)	2025-09-01 15:10:48.766624+00
b9588c77-103f-4e38-b9f0-caaa0d4c30a2	58236c15-a9d8-4e5b-9b79-1c3415bbec57	C-Corporation (1120)	2025-09-01 15:10:48.766624+00
90b82f9f-ec96-45e5-ba3f-1ad0addeacf4	58236c15-a9d8-4e5b-9b79-1c3415bbec57	Amended Returns	2025-09-01 15:10:48.766624+00
4e24d3e4-28d1-4119-b8ec-0a0a862d5a83	58236c15-a9d8-4e5b-9b79-1c3415bbec57	Nonprofit (990)	2025-09-01 15:10:48.766624+00
34e41dad-2064-4b87-a75b-afb0fd078cae	58236c15-a9d8-4e5b-9b79-1c3415bbec57	Trust & Estate (1041)	2025-09-01 15:10:48.766624+00
f8814774-b744-4bc1-8207-7f061bdfadf5	58236c15-a9d8-4e5b-9b79-1c3415bbec57	Bookkeeping & Close	2025-09-01 15:10:48.766624+00
64a78821-2b99-4f2a-933b-6187b2810180	58236c15-a9d8-4e5b-9b79-1c3415bbec57	State Franchise/Gross Receipts	2025-09-01 15:10:48.766624+00
afc06aa1-01fe-4bf4-946f-f630cf30b857	58236c15-a9d8-4e5b-9b79-1c3415bbec57	City/County Local Tax	2025-09-01 15:10:48.766624+00
c647b56f-ff97-437c-bf04-d25f5dcd545a	58236c15-a9d8-4e5b-9b79-1c3415bbec57	Nexus Analysis	2025-09-01 15:10:48.766624+00
3750dfc7-3d23-4bc0-9f85-6dc06209f133	58236c15-a9d8-4e5b-9b79-1c3415bbec57	Apportionment (Multi-State)	2025-09-01 15:10:48.766624+00
48b679bc-61df-4bd1-8237-e92b36c23d14	d4e9fc32-7de4-4614-b2e1-69700c5fe93f	Individual (Form 1040)	2025-08-30 20:35:56.541841+00
b7a1110a-6a43-4d33-93db-f9dcbededf29	d4e9fc32-7de4-4614-b2e1-69700c5fe93f	S-Corporation (1120-S)	2025-08-30 20:35:56.541841+00
ab628089-ac49-47c6-948a-2fd9cab3ac5f	d4e9fc32-7de4-4614-b2e1-69700c5fe93f	Amended Returns	2025-08-30 20:35:56.541841+00
626ef7fe-8021-4133-8c24-8d085a96b58e	d4e9fc32-7de4-4614-b2e1-69700c5fe93f	Representation & Notices	2025-08-30 20:35:56.541841+00
8397c350-d724-439c-a3ef-e220d3a7b8f6	58236c15-a9d8-4e5b-9b79-1c3415bbec57	California (CA)	2025-09-01 15:10:48.766624+00
e90e9411-44d3-4da1-9f98-472ef992f7e3	f5003bd9-d1a2-4164-adb4-3cd70c6995e9	Individual (Form 1040)	2025-09-01 17:45:32.674895+00
cd0e1978-18d2-407a-beec-743977422583	f5003bd9-d1a2-4164-adb4-3cd70c6995e9	Monthly Close & KPIs	2025-09-01 17:45:32.674895+00
6b903d94-5aa0-49d9-8510-d72006a19aa9	f5003bd9-d1a2-4164-adb4-3cd70c6995e9	EITC/CTC/ACTC	2025-09-01 17:45:32.674895+00
543a67bc-fc45-4a31-b4c3-824e5b0b7a1e	f5003bd9-d1a2-4164-adb4-3cd70c6995e9	Education Credits (AOTC/LLC)	2025-09-01 17:45:32.674895+00
304746ff-0823-4586-a8eb-b54bc99121e1	f5003bd9-d1a2-4164-adb4-3cd70c6995e9	New Child & Dependents	2025-09-01 17:45:32.674895+00
28d6dd9a-1817-4cdb-925d-eff10379d9cc	f5003bd9-d1a2-4164-adb4-3cd70c6995e9	Retirement, SS & Medicare	2025-09-01 17:45:32.674895+00
cdf8b706-a590-4aca-b74a-cef91619d157	c8ed3e7c-1a2b-4a91-a5a8-b6318ea94280	Individual (Form 1040)	2025-09-02 17:43:21.997708+00
2e8cd4c5-fdc1-4cb8-a188-df24e4fc7153	c8ed3e7c-1a2b-4a91-a5a8-b6318ea94280	S-Corporation (1120-S)	2025-09-02 17:43:21.997708+00
97e5de17-611c-4922-9f91-7cfffea76e67	c8ed3e7c-1a2b-4a91-a5a8-b6318ea94280	Representation & Notices	2025-09-02 17:43:21.997708+00
faedcec0-e82c-42a3-9ca5-a573563ea84f	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	s_corp	2025-08-29 18:00:02.032791+00
8b08b763-5a47-4113-9f18-28c1dbb70e29	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	multi_state	2025-08-29 18:00:02.032791+00
d4921c68-e052-4699-bba0-4bd4e6a487b8	4cddbda4-80c1-4615-9724-226eecbdb911	s_corp	2025-08-29 03:07:38.996944+00
fbef5e3b-5bda-4a5b-8d3b-f2c147dfd066	4cddbda4-80c1-4615-9724-226eecbdb911	multi_state	2025-08-29 03:07:38.996944+00
a106663b-c6d6-4ca4-9b84-31dfd9de33ac	4cddbda4-80c1-4615-9724-226eecbdb911	real_estate	2025-08-29 03:07:38.996944+00
4f07b5f3-9df1-4e2c-b563-2860fe4eebdf	4cddbda4-80c1-4615-9724-226eecbdb911	1040	2025-08-29 03:07:38.996944+00
dc2bae77-321b-4e42-96cf-aebb18c51dde	4cddbda4-80c1-4615-9724-226eecbdb911	business	2025-08-29 03:07:38.996944+00
b50c519b-eb5e-48e5-865b-14d1d63f4f64	4cddbda4-80c1-4615-9724-226eecbdb911	partnership	2025-08-29 03:07:38.996944+00
8bf756d6-9d4f-4a7f-8603-bac53ba966be	0334c0b3-2d26-4547-80e2-465d5139e88a	s_corp	2025-08-29 03:58:34.490106+00
590f0d38-43e4-48f6-8bed-f01723f48519	0334c0b3-2d26-4547-80e2-465d5139e88a	real_estate	2025-08-29 03:58:34.490106+00
7957168f-6d69-43de-a7b0-bd4de6dc98bc	0334c0b3-2d26-4547-80e2-465d5139e88a	irs_rep	2025-08-29 03:58:34.490106+00
e5d3b2a0-dd2d-4d57-a171-a80c1649304a	0334c0b3-2d26-4547-80e2-465d5139e88a	1040	2025-08-29 03:58:34.490106+00
b991014b-53eb-463d-be98-083565713110	0334c0b3-2d26-4547-80e2-465d5139e88a	business	2025-08-29 03:58:34.490106+00
d4a21edf-164e-4a9a-a60c-4a49a10b1bfe	0334c0b3-2d26-4547-80e2-465d5139e88a	estate_tax	2025-08-29 03:58:34.490106+00
cab91643-6854-4f2a-a74d-b6756c8111e0	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	real_estate	2025-08-29 18:00:02.032791+00
316ba0fd-4881-4bb8-8225-3ec86e0ae097	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	1040	2025-08-29 18:00:02.032791+00
6297cd0f-1793-458a-8a9b-2e431f6cca05	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	partnership	2025-08-29 18:00:02.032791+00
ddfcdad0-5fa7-41bc-ae2f-e37684539df8	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	business	2025-08-29 18:00:02.032791+00
87733d25-7e3b-406f-b2cc-4ad952f02ed6	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	1031_like_kind	2025-08-29 18:00:02.032791+00
61ef23a1-3995-46ab-8698-a9b3ae547b4d	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	s_election_2553	2025-08-29 18:00:02.032791+00
170a0af1-b315-4129-9384-1f4aa2785585	31290bd3-f403-4d32-9b76-f85f34f8e02b	Individual (Form 1040)	2025-08-31 23:25:29.223574+00
56bee795-edd6-4151-a8e3-484c733becec	31290bd3-f403-4d32-9b76-f85f34f8e02b	Partnership (1065)	2025-08-31 23:25:29.223574+00
521fb678-0210-4277-ae85-35924952f1c2	31290bd3-f403-4d32-9b76-f85f34f8e02b	S-Corporation (1120-S)	2025-08-31 23:25:29.223574+00
976a47bb-544a-4793-b129-ca63c9dc5f55	31290bd3-f403-4d32-9b76-f85f34f8e02b	C-Corporation (1120)	2025-08-31 23:25:29.223574+00
08e534d9-68e9-44a9-b987-af1c27492dcf	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	709_gift	2025-08-29 18:00:02.032791+00
78bf904e-e5ce-4e7f-a856-fc9704277886	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	1040_individual	2025-08-29 18:00:02.032791+00
58087767-9a6a-4d68-b0f8-a4e93bd04bf8	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	990_nonprofit	2025-08-29 18:00:02.032791+00
9a70edb4-b046-4f76-89c8-6f7f259abeef	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	1065_partnership	2025-08-29 18:00:02.032791+00
523fc3d5-4b85-4df0-9e91-7a0ede9855bf	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	1120s_s_corp	2025-08-29 18:00:02.032791+00
1e1e992b-5398-41a4-93f4-3cdcd09f9958	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	ubit_990t	2025-08-29 18:00:02.032791+00
2c12425f-989a-40ab-8bd6-37ac61f13f8a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	1023_1024_application	2025-08-29 18:00:02.032791+00
42540499-5020-4822-8e21-e8c6aaa1816d	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	education_savings_529	2025-08-29 18:00:02.032791+00
e6bd8472-2519-4cf9-992c-15fbe65eddf5	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	home_purchase_sale	2025-08-29 18:00:02.032791+00
e97d19d6-03c3-4ed2-92e4-c161db868a18	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	marriage_divorce_tax	2025-08-29 18:00:02.032791+00
45f8d33c-7f0f-4ad4-babb-ad83f6870a0d	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	new_child_dependents	2025-08-29 18:00:02.032791+00
8bc9e340-ed3a-472f-ba12-d19245c92ed4	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	retirement_income_ss_medicare	2025-08-29 18:00:02.032791+00
5357f78a-62ec-428a-96e2-7e2bb46e74f4	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	fbar_fincen114	2025-08-29 18:00:02.032791+00
b707698a-1bf0-4283-81c7-1a3462a6528a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	foreign_tax_credit_1116	2025-08-29 18:00:02.032791+00
6be51c26-aa47-42e6-85bb-52f5ca2d918d	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	ecommerce_marketplaces	2025-08-29 18:00:02.032791+00
08c3d5f3-cfff-4ca8-8398-83400a1fa96c	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	film_tv_section181	2025-08-29 18:00:02.032791+00
c4965988-ebd7-48be-bb38-f73725e02e09	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	gig_economy_platforms	2025-08-29 18:00:02.032791+00
ed3f692f-c5e0-4b0c-948d-397368bcbe47	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	healthcare_professionals	2025-08-29 18:00:02.032791+00
4f0c6901-22e8-483a-9d0d-fc4122e57890	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	short_term_rentals	2025-08-29 18:00:02.032791+00
ce68c74c-9123-4518-84a2-88d24a8b8e25	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	real_estate_investors	2025-08-29 18:00:02.032791+00
bdb225e3-9f3c-4c1d-8304-0203f78027b5	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	education_credits_aotc_llc	2025-08-29 18:00:02.032791+00
cd25cc7f-f5fd-49e5-8615-eb369b3c36e5	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	eitc_ctc_actc	2025-08-29 18:00:02.032791+00
dcdb26fd-fa4b-4656-828a-ccfbdb319f54	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	energy_credits_5695_ev_8936	2025-08-29 18:00:02.032791+00
e35b7831-1fd4-440b-9457-8e3b1703ec5a	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	chart_of_accounts_design	2025-08-29 18:00:02.032791+00
f161019c-3db7-4f17-97c6-49da50d9a6d1	48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	qbo_xero_setup_cleanup	2025-08-29 18:00:02.032791+00
b119e5f6-a69f-408e-91e8-ffc8066a39b6	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Individual (Form 1040)	2025-09-02 02:35:28.514471+00
ca2e2f6e-4390-4e5a-9087-da93e74f80ba	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Amended Returns	2025-09-02 02:35:28.514471+00
17722826-ed12-4c3a-8531-665950db1a3d	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Representation & Notices	2025-09-02 02:35:28.514471+00
4002ffc1-863c-4a25-9fb8-ff71b7291ee6	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Education Credits (AOTC/LLC)	2025-09-02 02:35:28.514471+00
009be8e7-d9d0-4f07-86e6-d37d8daef15e	a7df637f-5ba4-42a7-a84a-15b6c45fed00	EITC/CTC/ACTC	2025-09-02 02:35:28.514471+00
760c8c5a-21f0-46c7-8cde-60e83e4b780a	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Home/EV Energy Credits	2025-09-02 02:35:28.514471+00
547831f4-62ed-434d-9fa0-3a8508a5b2a1	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Casualty & Disaster Relief	2025-09-02 02:35:28.514471+00
4dfad6d1-8961-4204-9301-fb52e3d4f1a7	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Injured/Innocent Spouse	2025-09-02 02:35:28.514471+00
e3e0c257-dc78-477f-826f-3e944aec9313	069988ff-7336-4f47-bc0c-7850ba72285f	Individual (Form 1040)	2025-08-30 16:53:39.662346+00
c1467686-8a6f-4fab-b2c8-3838ebd8edca	069988ff-7336-4f47-bc0c-7850ba72285f	S-Corporation (1120-S)	2025-08-30 16:53:39.662346+00
93999cfa-fff7-42d5-b072-8df2e8d34369	069988ff-7336-4f47-bc0c-7850ba72285f	Partnership (1065)	2025-08-30 16:53:39.662346+00
3c430d41-36d7-4701-abb7-e7e272758c5e	069988ff-7336-4f47-bc0c-7850ba72285f	C-Corporation (1120)	2025-08-30 16:53:39.662346+00
57c7cb3b-b545-4ad4-b24d-70cf82dbe7b6	069988ff-7336-4f47-bc0c-7850ba72285f	Payroll (941/940)	2025-08-30 16:53:39.662346+00
e6ed6bfb-98ab-4aae-8460-c0e8a0727250	069988ff-7336-4f47-bc0c-7850ba72285f	Amended Returns	2025-08-30 16:53:39.662346+00
482a9c4b-8463-4e20-9bdc-3aa27a2e6e6c	069988ff-7336-4f47-bc0c-7850ba72285f	Representation & Notices	2025-08-30 16:53:39.662346+00
bc3525f5-3224-4f2a-923b-3ba8bc97d7a1	069988ff-7336-4f47-bc0c-7850ba72285f	1099 Information Reporting	2025-08-30 16:53:39.662346+00
1a22e8de-bea0-41af-919c-4beaeabf3833	069988ff-7336-4f47-bc0c-7850ba72285f	Gift Tax (709)	2025-08-30 16:53:39.662346+00
cf9329ad-8e46-4c76-94b5-35a1bc3e1ac4	069988ff-7336-4f47-bc0c-7850ba72285f	Trust & Estate (1041)	2025-08-30 16:53:39.662346+00
62fdc69a-255a-464c-8240-77d9ebf13633	069988ff-7336-4f47-bc0c-7850ba72285f	Bookkeeping & Close	2025-08-30 16:53:39.662346+00
3798bb93-b9a4-4d22-941f-fd167f6b2ae4	069988ff-7336-4f47-bc0c-7850ba72285f	QBO/Xero Setup & Cleanup	2025-08-30 16:53:39.662346+00
e37191b7-e811-4e23-951e-1acd50245981	069988ff-7336-4f47-bc0c-7850ba72285f	Chart of Accounts Design	2025-08-30 16:53:39.662346+00
8c334151-ad97-41a1-b26a-e91c36fc75fc	069988ff-7336-4f47-bc0c-7850ba72285f	Apportionment (Multi-State)	2025-08-30 16:53:39.662346+00
42ae35cb-ae59-42f5-8bd7-dcc5634bc371	069988ff-7336-4f47-bc0c-7850ba72285f	Nexus Analysis	2025-08-30 16:53:39.662346+00
0180bee1-27f4-4f91-afa9-b2cfc9ef667e	069988ff-7336-4f47-bc0c-7850ba72285f	Notice Responses	2025-08-30 16:53:39.662346+00
a844947e-f13b-4e6d-8daa-66d463756516	44e38eb2-5c51-433e-94c5-13e59a34e81c	Individual (Form 1040)	2025-08-31 17:54:54.925048+00
04add58b-06a4-4d3e-89c8-0e8d1c1b6554	44e38eb2-5c51-433e-94c5-13e59a34e81c	Amended Returns	2025-08-31 17:54:54.925048+00
239e2649-4937-432d-a619-5a8483f4bc53	44e38eb2-5c51-433e-94c5-13e59a34e81c	Estate Tax (706)	2025-08-31 17:54:54.925048+00
5fa9ee23-5172-4d55-b5a1-d71566bbb919	44e38eb2-5c51-433e-94c5-13e59a34e81c	Gift Tax (709)	2025-08-31 17:54:54.925048+00
b0699f96-456c-43f0-83f6-fab59051c601	44e38eb2-5c51-433e-94c5-13e59a34e81c	Trust & Estate (1041)	2025-08-31 17:54:54.925048+00
19cfdaac-b1a4-473c-935d-3331fb156538	44e38eb2-5c51-433e-94c5-13e59a34e81c	Education Savings (529)	2025-08-31 17:54:54.925048+00
337c7ded-5a30-4c47-9a4c-502921598ff6	44e38eb2-5c51-433e-94c5-13e59a34e81c	Home Purchase/Sale	2025-08-31 17:54:54.925048+00
71330691-0af3-4cc2-839c-6a4d15ac495f	44e38eb2-5c51-433e-94c5-13e59a34e81c	Marriage/Divorce	2025-08-31 17:54:54.925048+00
75de2466-8381-4be4-92c4-ab5193707ec5	44e38eb2-5c51-433e-94c5-13e59a34e81c	New Child & Dependents	2025-08-31 17:54:54.925048+00
a1659c3c-611c-4d2e-8fa3-8ad22cb4077b	44e38eb2-5c51-433e-94c5-13e59a34e81c	Retirement, SS & Medicare	2025-08-31 17:54:54.925048+00
afd239ff-6426-4d97-8c31-47761c6ae10e	44e38eb2-5c51-433e-94c5-13e59a34e81c	California (CA)	2025-08-31 17:54:54.925048+00
7d2de853-d592-4066-b3c5-71ede0d893de	9bf599de-ebc6-44a9-bead-c26989ef9bab	Individual (Form 1040)	2025-09-01 00:25:11.908293+00
5cdcf05c-e89b-414b-8bc1-727556b232e0	9bf599de-ebc6-44a9-bead-c26989ef9bab	S-Corporation (1120-S)	2025-09-01 00:25:11.908293+00
eb49b61a-a282-49af-8b56-3076cf8e08c2	9bf599de-ebc6-44a9-bead-c26989ef9bab	Partnership (1065)	2025-09-01 00:25:11.908293+00
a1bc7477-84e6-4ce1-bfac-d298eaef33f7	9bf599de-ebc6-44a9-bead-c26989ef9bab	C-Corporation (1120)	2025-09-01 00:25:11.908293+00
d16a95b4-cc33-42f4-abae-81c4940bbe29	9bf599de-ebc6-44a9-bead-c26989ef9bab	Amended Returns	2025-09-01 00:25:11.908293+00
386b78dd-542c-4978-9905-117e307a4d02	9bf599de-ebc6-44a9-bead-c26989ef9bab	Bookkeeping & Close	2025-09-01 00:25:11.908293+00
2a9bfcf1-2de3-4738-8aef-2228d5d4d46f	9bf599de-ebc6-44a9-bead-c26989ef9bab	Chart of Accounts Design	2025-09-01 00:25:11.908293+00
d62df239-975e-4290-8c2d-3deaecda58f7	9bf599de-ebc6-44a9-bead-c26989ef9bab	Education Savings (529)	2025-09-01 00:25:11.908293+00
9e07be26-98a4-46b5-bf55-f655cf88b77d	9bf599de-ebc6-44a9-bead-c26989ef9bab	Home Purchase/Sale	2025-09-01 00:25:11.908293+00
cf8759b2-f7ac-463e-91db-618f4202b626	9bf599de-ebc6-44a9-bead-c26989ef9bab	New Child & Dependents	2025-09-01 00:25:11.908293+00
ec962771-a900-42f1-9b31-750211acf4e3	9bf599de-ebc6-44a9-bead-c26989ef9bab	Retirement, SS & Medicare	2025-09-01 00:25:11.908293+00
26ad0af9-6820-4cff-ae07-441952340824	9bf599de-ebc6-44a9-bead-c26989ef9bab	Apportionment (Multi-State)	2025-09-01 00:25:11.908293+00
f8ee1517-2b54-4ee4-83da-cf0d0c0cffe6	9bf599de-ebc6-44a9-bead-c26989ef9bab	City/County Local Tax	2025-09-01 00:25:11.908293+00
148c1282-c53f-4643-85dc-da6032623363	9bf599de-ebc6-44a9-bead-c26989ef9bab	New York (NY)	2025-09-01 00:25:11.908293+00
1f29fdaf-3229-4c6a-be29-7417638abe06	9bf599de-ebc6-44a9-bead-c26989ef9bab	Penalty Abatement	2025-09-01 00:25:11.908293+00
62c54d25-773e-490f-b88f-5641068441d4	9bf599de-ebc6-44a9-bead-c26989ef9bab	Notice Responses	2025-09-01 00:25:11.908293+00
5956d868-fe56-411f-9b61-238bd3a08a67	9bf599de-ebc6-44a9-bead-c26989ef9bab	EITC/CTC/ACTC	2025-09-01 00:25:11.908293+00
66b4aeb8-2285-4f01-9693-5b2a5c081b4e	9bf599de-ebc6-44a9-bead-c26989ef9bab	Inventory & Job Costing	2025-09-01 00:25:11.908293+00
8cc5e108-a931-4af8-b6b6-80d532eb67fb	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Home Purchase/Sale	2025-09-02 02:35:28.514471+00
f021ab60-8d07-41d2-9bb1-c2f1d6d64166	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Marriage/Divorce	2025-09-02 02:35:28.514471+00
f172e4ae-a40b-4347-a7ca-d0e6d0eaf6ac	a7df637f-5ba4-42a7-a84a-15b6c45fed00	New Child & Dependents	2025-09-02 02:35:28.514471+00
3d3a7691-90e3-42a3-b627-adc131f3b641	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Retirement, SS & Medicare	2025-09-02 02:35:28.514471+00
df1c94f2-e018-4607-87be-f28d259f7f88	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Education Savings (529)	2025-09-02 02:35:28.514471+00
db449dbf-557b-4bc9-88a1-4233dfc98ce7	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Apportionment (Multi-State)	2025-09-02 02:35:28.514471+00
b59f8d56-1407-4a09-92e8-609f01881df3	a7df637f-5ba4-42a7-a84a-15b6c45fed00	California (CA)	2025-09-02 02:35:28.514471+00
3187bbcd-3dba-4933-a66b-77868cfda9c6	a7df637f-5ba4-42a7-a84a-15b6c45fed00	New York (NY)	2025-09-02 02:35:28.514471+00
d53584a0-5535-47f0-8f52-74979978f588	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Texas (TX)	2025-09-02 02:35:28.514471+00
f9a9c019-47e8-4729-8efb-91b190becd8b	a7df637f-5ba4-42a7-a84a-15b6c45fed00	IRS Exams & Audits	2025-09-02 02:35:28.514471+00
1eea4969-596e-4320-911d-0bfade55109c	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Notice Responses	2025-09-02 02:35:28.514471+00
abf54fd7-caac-4800-a553-3a0f2d30bab1	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Collections (IA/OIC)	2025-09-02 02:35:28.514471+00
68d29b36-6339-48e1-bd42-f53e591543e4	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Penalty Abatement	2025-09-02 02:35:28.514471+00
188843a9-56c8-4e7a-ad14-28545fbe5021	a7df637f-5ba4-42a7-a84a-15b6c45fed00	TFRP Defense	2025-09-02 02:35:28.514471+00
0934c4c9-a254-4e72-b1b7-7260aef6d25c	a7df637f-5ba4-42a7-a84a-15b6c45fed00	Payroll Tax Issues	2025-09-02 02:35:28.514471+00
f0cc2ecd-b7b7-4c84-b8b8-b527f84a7cf2	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Individual (Form 1040)	2025-09-01 16:56:34.513202+00
d83722c5-f1f8-4c4e-bb43-cd3990c18b78	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	S-Corporation (1120-S)	2025-09-01 16:56:34.513202+00
488d3dcc-95b2-4826-ad66-866f932d8949	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Partnership (1065)	2025-09-01 16:56:34.513202+00
fa3b0505-b50f-4f0d-8f1c-de538b28b7e2	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	C-Corporation (1120)	2025-09-01 16:56:34.513202+00
93317fee-7a43-4dba-ad96-ac15017878d3	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Amended Returns	2025-09-01 16:56:34.513202+00
2c47f018-7e1f-4576-8be7-2703154f1d32	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Representation & Notices	2025-09-01 16:56:34.513202+00
2c7a1c57-ca6e-4503-832b-2ea24fa389d8	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Bookkeeping & Close	2025-09-01 16:56:34.513202+00
e9e9b348-5621-4385-9a46-3b2bd64e45a9	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Chart of Accounts Design	2025-09-01 16:56:34.513202+00
077ae511-3193-4755-9adf-708e8afc54c6	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Education Credits (AOTC/LLC)	2025-09-01 16:56:34.513202+00
9585b24d-0e0e-48e4-91f2-e05537822446	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	EITC/CTC/ACTC	2025-09-01 16:56:34.513202+00
ea666eca-7d42-43d6-a545-68fb8fbefbd5	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	R&D Credit (6765)	2025-09-01 16:56:34.513202+00
09899218-056f-4689-9d66-02614c2303d8	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Education Savings (529)	2025-09-01 16:56:34.513202+00
fcf1ed15-8e78-4d97-804d-c730b81fa2bb	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Home Purchase/Sale	2025-09-01 16:56:34.513202+00
db303d18-505b-409a-88aa-a2bb3ad01a71	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Marriage/Divorce	2025-09-01 16:56:34.513202+00
cc0fe392-0410-49ee-b7c8-98082e1dce0a	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	New Child & Dependents	2025-09-01 16:56:34.513202+00
b65f8434-1fba-4126-9efd-c7c2453286d2	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Retirement, SS & Medicare	2025-09-01 16:56:34.513202+00
7bd32c4c-1d0e-4430-908c-ada18588e114	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	Apportionment (Multi-State)	2025-09-01 16:56:34.513202+00
d2c8b6b0-8e83-4096-af0e-f4c47180f333	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	New York (NY)	2025-09-01 16:56:34.513202+00
004220b0-7d0c-4ac8-b1b9-3487ecd3fb8a	18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	1099-K/CP2100(B) Workflows	2025-09-01 16:56:34.513202+00
64b035f3-a015-44b9-ba61-f6598603f9f3	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Amended Returns	2025-09-03 03:01:56.192943+00
3c98cbaf-d75b-4ded-9dc9-f4d93ddf48f3	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Apportionment (Multi-State)	2025-09-03 03:01:56.192943+00
94dad41a-35a4-4dca-a296-59611ea24b7a	8123510e-0b15-46e9-b6d5-f7e1695bdadb	California (CA)	2025-09-03 03:01:56.192943+00
a9ecc30a-d7ca-42c7-b1a2-3ee35d4e974a	8123510e-0b15-46e9-b6d5-f7e1695bdadb	City/County Local Tax	2025-09-03 03:01:56.192943+00
1217f2eb-b7bf-40aa-af79-6a0047174b67	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Education Credits (AOTC/LLC)	2025-09-03 03:01:56.192943+00
4af87215-f5d1-4066-87b6-1e3135029d1c	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Education Savings (529)	2025-09-03 03:01:56.192943+00
5d2c4b87-d1d6-47ac-b412-b2702147bcdf	8123510e-0b15-46e9-b6d5-f7e1695bdadb	EITC/CTC/ACTC	2025-09-03 03:01:56.192943+00
7206301a-5f93-44a0-abe3-296314127688	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Home Purchase/Sale	2025-09-03 03:01:56.192943+00
241bb1ca-fbdb-4082-9d54-bca55a10a27b	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Home/EV Energy Credits	2025-09-03 03:01:56.192943+00
9d5d7225-4591-4b3e-ac76-185d322264c4	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Individual (Form 1040)	2025-09-03 03:01:56.192943+00
93d0ca8a-433b-4d1d-87a2-f6ee58e02025	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Marriage/Divorce	2025-09-03 03:01:56.192943+00
f3dab91d-f995-4eda-ad12-072be7163266	8123510e-0b15-46e9-b6d5-f7e1695bdadb	New Child & Dependents	2025-09-03 03:01:56.192943+00
fbf9df62-bce1-4750-adba-1bafeafa679b	8123510e-0b15-46e9-b6d5-f7e1695bdadb	New York (NY)	2025-09-03 03:01:56.192943+00
c66a30d3-a86f-417d-94f2-6be69cee4699	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Notice Responses	2025-09-03 03:01:56.192943+00
00afb78d-1824-41a0-8e2d-0289b37b391a	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Individual (Form 1040)	2025-09-01 16:59:49.53858+00
311ee93c-c52f-47dc-b1a2-68f600f98522	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	S-Corporation (1120-S)	2025-09-01 16:59:49.53858+00
4c80bb52-70b7-4c5e-9a3f-ea9ee7098799	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Partnership (1065)	2025-09-01 16:59:49.53858+00
e63c2e55-494c-4ebd-8d2f-0002bdd8093c	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	C-Corporation (1120)	2025-09-01 16:59:49.53858+00
5e6649c6-e745-409d-88ac-97f012321305	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Amended Returns	2025-09-01 16:59:49.53858+00
7fd86051-7ba8-4c2d-b479-12294c69130b	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Trust & Estate (1041)	2025-09-01 16:59:49.53858+00
5245958e-0063-45f4-a22b-b756d146196f	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Healthcare Professionals	2025-09-01 16:59:49.53858+00
5b3e1857-024b-4273-ac5c-1c0d5cf23d27	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Oil & Gas	2025-09-01 16:59:49.53858+00
1295bee1-5175-41f1-bb08-bb3ef2671efc	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Trucking & Logistics	2025-09-01 16:59:49.53858+00
95dee01c-6a00-41fa-9668-32e00c2bbb36	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Real Estate Investors	2025-09-01 16:59:49.53858+00
1b96db50-cb73-42a9-b663-39a9ddf9e531	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Gig Economy	2025-09-01 16:59:49.53858+00
8a513548-bf29-401f-be86-fa263187474e	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Restaurants & Food	2025-09-01 16:59:49.53858+00
954077c7-d6f2-4e96-a0d9-089716351299	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	E-commerce & Marketplaces	2025-09-01 16:59:49.53858+00
ce09f690-f325-45a6-bf0f-5ded82a1aeb4	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Construction & Contractors	2025-09-01 16:59:49.53858+00
15587810-2113-4dc1-9407-4b624e1be333	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Manufacturing	2025-09-01 16:59:49.53858+00
960f314d-c390-473c-95a6-844f630e3bea	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Short-Term Rentals	2025-09-01 16:59:49.53858+00
ecba66c2-74a2-4726-bf59-b170429d494f	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Education Savings (529)	2025-09-01 16:59:49.53858+00
e8bfaaff-489e-470d-980f-0ac43ee48a1c	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Home Purchase/Sale	2025-09-01 16:59:49.53858+00
880b6ba3-28d5-4646-bf11-e5881965a9b6	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Retirement, SS & Medicare	2025-09-01 16:59:49.53858+00
a8fa2a3f-33e3-4a7a-9679-77ceca5c2368	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Marriage/Divorce	2025-09-01 16:59:49.53858+00
7ae97cd0-6505-4a24-a136-cc4361548a51	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	New Child & Dependents	2025-09-01 16:59:49.53858+00
26fe852c-97b2-4aeb-9e34-b3c98fe50594	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	FBAR (FinCEN 114)	2025-09-01 16:59:49.53858+00
41f66181-e149-45e3-aa13-b5155cf81f70	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Foreign Earned Income (2555)	2025-09-01 16:59:49.53858+00
2094332c-98d9-4a8c-987d-f29d5ffb10b1	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	FATCA (8938)	2025-09-01 16:59:49.53858+00
7468ef54-2b12-4262-8810-3b5c3bf49813	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Foreign Partnership (8865)	2025-09-01 16:59:49.53858+00
2cc362f7-396f-4de6-9bbe-f063d4bde1ec	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Foreign Tax Credit (1116)	2025-09-01 16:59:49.53858+00
8ac94646-40e2-4809-9f44-ed3e5a54bb92	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Foreign-Owned US Corp (5472)	2025-09-01 16:59:49.53858+00
5268589b-6bda-4a34-a289-19b60cb1823c	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Foreign Disregarded Entity (8858)	2025-09-01 16:59:49.53858+00
715b7e11-dd7a-412e-83b2-2d98642095cf	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	CFC (5471)	2025-09-01 16:59:49.53858+00
786ae8ea-52e2-452e-9c21-77d73f769bc1	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Apportionment (Multi-State)	2025-09-01 16:59:49.53858+00
2a793971-012a-4c98-859b-eccc5066b25b	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	State Franchise/Gross Receipts	2025-09-01 16:59:49.53858+00
4296de38-2b21-4917-8b6b-04b1f99c5198	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Texas (TX)	2025-09-01 16:59:49.53858+00
5de7a928-bc8a-4e70-9787-62d708aa5f6b	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	§754/§743(b) Adjustments	2025-09-01 16:59:49.53858+00
154ada2f-1a13-438a-97ea-519b8b037699	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	1031 Exchanges	2025-09-01 16:59:49.53858+00
ed81f73d-7a4b-48e5-8eb3-aeda5acec057	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Estimated Tax Planning	2025-09-01 16:59:49.53858+00
1bbc545f-08c4-4e0c-9293-0ac1de67fafb	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Retirement Plans (SEP/Solo 401k)	2025-09-01 16:59:49.53858+00
934d1141-db20-4b49-a04f-96c54a56bdb3	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	S-Election (2553)	2025-09-01 16:59:49.53858+00
862bcc88-cdd8-4e3b-9d97-4f50b63ee887	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	NOL Planning	2025-09-01 16:59:49.53858+00
0264f622-b14f-49f2-8b69-e26264d6ac71	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	California (CA)	2025-09-01 16:59:49.53858+00
1613259e-7fb9-4531-b46e-395bbdf9ebfd	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	City/County Local Tax	2025-09-01 16:59:49.53858+00
9ff06266-84ee-4588-a2c1-4a7d68bed4f6	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Crypto / DeFi / NFT	2025-09-01 16:59:49.53858+00
4c943922-66f6-42ec-9768-1a2de7add402	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Casualty & Disaster Relief	2025-09-01 16:59:49.53858+00
4e115af6-bb8c-4a41-a210-3ed839104e79	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Education Credits (AOTC/LLC)	2025-09-01 16:59:49.53858+00
048b421d-2a6f-40f9-976e-73e916dde834	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	EITC/CTC/ACTC	2025-09-01 16:59:49.53858+00
4af71019-0e70-4385-9f54-056a0537587f	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	WOTC	2025-09-01 16:59:49.53858+00
f1c2d99a-abcb-4219-a0ff-bf10ad8253c7	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Home/EV Energy Credits	2025-09-01 16:59:49.53858+00
52dce938-aa5d-49ee-b1bd-e1f1b871c5a7	57da36fd-e1ad-42f0-8484-faa0d0f80d4e	Entity Selection (8832/2553)	2025-09-01 16:59:49.53858+00
851ca9c4-b3bf-4d44-afed-f83bcd8d1ed9	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Individual (Form 1040)	2025-09-02 16:17:46.558185+00
6b609fe0-2543-4605-b620-1bee2eabb0ec	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	S-Corporation (1120-S)	2025-09-02 16:17:46.558185+00
c8ba2063-5062-4b41-95d9-a0d56aa468b8	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Amended Returns	2025-09-02 16:17:46.558185+00
214519a4-d7d1-4bc9-b77b-38da09a87fb0	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	C-Corporation (1120)	2025-09-02 16:17:46.558185+00
ebadb42f-603e-4200-869d-eaef8e465938	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	QBO/Xero Setup & Cleanup	2025-09-02 16:17:46.558185+00
e1fbe973-c8a7-4ea9-9d9e-5fdb1b0fbed2	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Bookkeeping & Close	2025-09-02 16:17:46.558185+00
538faec6-96b3-4fa8-8067-62cb856b6ceb	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Education Credits (AOTC/LLC)	2025-09-02 16:17:46.558185+00
d228b355-6f67-4c9e-aaa8-ce5057eed3ee	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	EITC/CTC/ACTC	2025-09-02 16:17:46.558185+00
63c7b890-9a73-4fe0-8778-035d807f7932	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Education Savings (529)	2025-09-02 16:17:46.558185+00
b1733da9-444d-4a58-ac51-eba61beedabc	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Home Purchase/Sale	2025-09-02 16:17:46.558185+00
7a67fb06-51eb-4a3f-837c-cf202b7dfbb0	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	New Child & Dependents	2025-09-02 16:17:46.558185+00
24adf51e-9a15-4b2c-abce-8fe6b27d3e80	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Retirement, SS & Medicare	2025-09-02 16:17:46.558185+00
ea6546e8-2011-4148-bfd0-1527a49c9d03	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Marriage/Divorce	2025-09-02 16:17:46.558185+00
ba1217b1-b121-4b9a-8789-ce38affb9282	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Apportionment (Multi-State)	2025-09-02 16:17:46.558185+00
05dc4bd1-039c-43ff-8bbe-f5147b756328	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	New York (NY)	2025-09-02 16:17:46.558185+00
6657e51c-b4b6-4e9c-8aab-9cc1a24af354	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Payroll (941/940)	2025-09-02 16:17:46.558185+00
b7f511a3-5d36-4aef-9eda-073cf8be5c42	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	1099 Information Reporting	2025-09-02 16:17:46.558185+00
fb43abd8-4ab5-4bca-9aa6-2c150a419202	f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	Fringe Benefits Taxability	2025-09-02 16:17:46.558185+00
c12d1019-7e77-4c99-b30f-b58f957365fc	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Partnership (1065)	2025-09-03 03:01:56.192943+00
99f16473-9734-4d32-8583-bdda4e725e31	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Payroll (941/940)	2025-09-03 03:01:56.192943+00
2ee9fdf4-8995-455a-ac3f-5d871b3708df	8123510e-0b15-46e9-b6d5-f7e1695bdadb	Retirement, SS & Medicare	2025-09-03 03:01:56.192943+00
74397202-5fb6-4c5e-9084-aea97f4937b2	8123510e-0b15-46e9-b6d5-f7e1695bdadb	S-Corporation (1120-S)	2025-09-03 03:01:56.192943+00
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, user_id, first_name, last_name, headline, bio, credential_type, ptin, website_url, linkedin_url, firm_name, phone, public_email, avatar_url, is_listed, visibility_state, accepting_work, slug, created_at, updated_at, clerk_id, image_url, email, other_software, onboarding_complete, is_admin, is_deleted, deleted_at, deleted_by, clerk_user_id, public_contact, works_multistate, works_international, countries, tos_version, tos_accepted_at, privacy_version, privacy_accepted_at, specializations, states, software, email_preferences, email_frequency, last_email_sent, primary_location, location_radius, opportunities, years_experience, entity_revenue_range) FROM stdin;
48cf1e3d-35d0-42c4-ab91-cb70c9bb7d08	\N	Jen	Dudley	1040 and Real Estate Power House- 1120S & 1065s	I currently prepare 1040, 1120S & 1065s and perform 1040 reviews at a Top 24 firm and looking to venture out on my own ASAP. 75% of current clients are in real estate in some form. I am extremely tech savvy and have worked remotely for close to a decade. Software experience includes CCH Axcess, Ultra Tax, ProConnect, and more! I am a self-proclaimed tax nerd that obsesses about details, accuracy, and ensuring an accurate return and excellent client experience. Prior to changing careers to tax, I spent 15 years in client facing business development and consulting with executive level clients within Fortune 500 companies.	CPA	\N		https://www.linkedin.com/in/jendudley/	Flourish Tax Group	303-880-4171	jen@flourishtax.com	\N	t	verified	t	jen-dudley	2025-08-28 23:29:05.066862+00	2025-08-29 18:00:01.544026+00	user_31vKNVm929Fv5mON2vHJ0FS58rP	\N	\N	{"Intuit ProConnect","QuickBooks Online"}	t	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
2bf23572-2974-4ce2-a7a1-4a9260e6a5ab	\N	New User		New User	\N	Other	\N	\N	\N	\N	\N	info@compasstaxla.com	\N	f	hidden	f	user-user324	2025-08-31 23:20:01.938778+00	2025-08-31 23:20:18.172082+00	user_324afXVesUgR9YX1Rpmik2yajlO	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXQzMEJxUUlXVldvRlNUVlFPVENSb0VVRzkiLCJyaWQiOiJ1c2VyXzMyNGFmWFZlc1VnUjlZWDFScG1pazJ5YWpsTyJ9	info@compasstaxla.com	{}	f	f	f	\N	\N	\N	f	f	f	{}	v1	2025-08-31 23:20:17.908+00	v1	2025-08-31 23:20:17.908+00	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
a457940f-66d8-40d5-820e-059dd947a06d	\N	New User		New User	\N	Other	\N	\N	\N	\N	\N	derek@dfootecpa.com	\N	f	pending_verification	f	user-user322	2025-08-31 02:38:36.327573+00	2025-09-01 00:04:07.000616+00	user_3229gjaqO7TFBHpnCRDwy0xf0Lm	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXQzMEJxUUlXVldvRlNUVlFPVENSb0VVRzkiLCJyaWQiOiJ1c2VyXzMyMjlnamFxTzdURkJIcG5DUkR3eTB4ZjBMbSJ9	derek@dfootecpa.com	{}	f	f	f	\N	\N	\N	f	f	f	{}	v1	2025-08-31 02:38:48.72+00	v1	2025-08-31 02:38:48.72+00	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
23af0bba-9e8f-4a79-8376-698f79cf1d2d	\N	Paul	S	Paul S	\N	Other	\N	\N	\N	\N	\N	prtpal@zohomail.com	\N	f	pending_verification	f	paul-s-user328	2025-09-02 07:17:04.524737+00	2025-09-02 14:42:41.322022+00	user_328LniCghtwyHz2fbEecPXQSEjp	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjhMbmtyNThQU3ROQ09GQVUyOWZDZDFRNksifQ	prtpal@zohomail.com	{}	f	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
9bf599de-ebc6-44a9-bead-c26989ef9bab	\N	Edward	Kane	Edward Kane, CPA ready to help	CPA who works as a CFO in educational services as well as own's his own tax practice.   	CPA	\N	www.ekanecpa.com		Edward Kane, CPA LLC		edward@ekanecpa.com	\N	t	verified	t	edward-kane-user324	2025-09-01 00:21:18.173033+00	2025-09-01 00:29:19.478452+00	user_324i7An5f98IsTR9q0YzU6syYGl	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjRpN0FBT0s1MVhWU2RlenFNWWw3Smg4YlQifQ	edward@ekanecpa.com	{ProWareFixedAssets}	t	f	f	\N	\N	\N	f	t	f	{}	\N	\N	\N	\N	{}	{AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY}	{}	\N	immediate	\N	{"city": "Metuchen", "state": "NJ", "country": "US", "display_name": null}	50	\N	\N	\N
c31ac9cb-f828-48f0-882f-bb428e8e8cf8	\N	Alvin	Choy	Alvin Choy	I am a solo tax practitioner and NYC-based CPA with 25+ years of experience in Federal and State Business Income Tax Planning and Compliance for Corporations (C, S), Partnerships, LLCs for various industries (including tech, PE, retail, real estate). Prior to going solo in 2025, I was a Senior Federal Tax Manager for IBM corporate headquarters in Armonk, as well as for Bloomberg LP's income tax department. \nMy specialties include Research Tax Credits, R&D related tax planning (Sec. 174A) and Other Incentives (e.g., Sec 199A Qualified Business Income Deductions).\nI handle IRS audit readiness and representation for corporations and partnerships in various income tax areas. \nI have extensive experience working with in-house tax counsel, tax litigation attorneys as well as IRS agents, territory manager and counsel on defending income tax deductions, foreign tax credits and research credits.\nI provide Pillar Two consulting for complex business entity structures, and provide guidance on implementation.  \nI also provide Chinese and Hong Kong Tax consulting services for US companies with operations in the Greater China Region.\nI work part-time only and I am looking forward to connecting with other solo CPAs, CPAs who work for in-house tax departments and CPA firms. 	CPA	\N		http://linkedin.com/in/alvin-choy-a-choy-cpa-pllc-7275a61	A Choy CPA PLLC 		alvin@choycpa.com	\N	t	verified	t	alvin-choy-user31t	2025-08-29 15:37:33.114171+00	2025-09-01 16:00:11.552926+00	user_31tjBMCYAEDUQz3xWg0P8AawAhp	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXQzMEJxUUlXVldvRlNUVlFPVENSb0VVRzkiLCJyaWQiOiJ1c2VyXzMxdGpCTUNZQUVEVVF6M3hXZzBQOEFhd0FocCIsImluaXRpYWxzIjoiQUMifQ	alvin@choycpa.com	{}	t	f	f	\N	\N	\N	t	t	f	{}	\N	\N	\N	\N	{}	{AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY}	{}	\N	immediate	\N	{"city": "New York ", "state": "NY", "country": "US", "display_name": null}	50	\N	\N	\N
069988ff-7336-4f47-bc0c-7850ba72285f	\N	Drew	Sullivan	Drew Sullivan CPA, PFS	Tax Advisor to private investors, professionals and small business owners	CPA	\N	https://ptastl.com		Pacific Tax & Accounting	314-279-9851	ajsd36@gmail.com	\N	t	verified	t	drew-sullivan-user321	2025-08-30 16:50:46.331189+00	2025-08-30 17:17:58.133693+00	user_3210ChJgFSgyg5erY71PV9c6C4R	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjEwQ2Z3dm9MRUN1V0tWWVFDMXREZW5XZXgifQ	ajsd36@gmail.com	{}	t	f	f	\N	\N	\N	t	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
18f5c658-852e-4e05-8f1a-a6e4d4a6ac08	\N	Parth	Mehta	Parth Mehta, CPA, MST	Several years at both small and mid tier accounting firms, I have learned and exclusions the best of both worlds and can thrive with individuals, HNW individuals and small businesses. 	CPA	\N	Parthmehtacpa.com	https://www.linkedin.com/in/parthmehtacpa/	Parth Mehta CPA, PC	2154609362	Parth.Mehta@hey.com	\N	t	verified	t	parth-mehta-user326	2025-09-01 16:51:44.577596+00	2025-09-01 17:06:04.273733+00	user_326eZGk8rNp1RDWCZm4j71AyTkf	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjZlWkVuS3FudG5vZUdyQXJXNVlVQkdZUncifQ	parth.mehta@hey.com	{}	t	f	f	\N	\N	\N	t	t	f	{}	\N	\N	\N	\N	{}	{AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY}	{}	\N	immediate	\N	{"city": "Philadelphia", "state": "PA", "country": "US", "display_name": null}	50	\N	\N	\N
d4e9fc32-7de4-4614-b2e1-69700c5fe93f	\N	Slavena	Paskova	Enrolled Agent		EA	\N			Coast to coast tax service		slavenapaskova@gmail.com	\N	t	pending_verification	t	slavena-paskova-user321	2025-08-30 20:32:58.718418+00	2025-08-30 20:41:55.592816+00	user_321RECE7LWpPIxIUvdP8ygW2bE3	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjFSRThxY2xrZFB3OVAyenh1OU1pWUxRWGQifQ	slavenapaskova@gmail.com	{}	t	f	f	\N	\N	\N	t	t	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
4cddbda4-80c1-4615-9724-226eecbdb911	\N	Kenia	Perez	EA	I’m an Enrolled Agent and experienced public accountant with over 7 years of experience in tax compliance, financial reporting, and client advisory services. I began my career in accounting after exploring my passion for history and discovering a love for numbers and financial systems. Since then, I’ve developed expertise in individual and business taxation across multiple states, \nand bookkeeping for diverse industries. I aim to learn as much as I can in the field and expand my knowledge, with the long-term goal of transitioning into academia and applying those skills to teach and mentor future accounting professionals.\n	EA	\N		http://www.linkedin.com/in/kenialperez		9193443786	klperez96@icloud.com	\N	t	verified	t	kenia-perez-4cddbda4	2025-08-29 02:59:37.707021+00	2025-08-29 16:49:36.889744+00	user_31wY0554U5qi2HQC7pOXC0MhCrI	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXQzMEJxUUlXVldvRlNUVlFPVENSb0VVRzkiLCJyaWQiOiJ1c2VyXzMxd1kwNTU0VTVxaTJIUUM3cE9YQzBNaENySSJ9	klperez96@icloud.com	{Karbon,QBO,GofileRoom,FixedAssetsCS}	t	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
44e38eb2-5c51-433e-94c5-13e59a34e81c	\N	Tiffany	McBride	Tiffany McBride	CPA focused on HNW individuals and trusts. 	CPA	\N	www.tmtaxaccounting.com		TM Tax Accounting	7025233000	Tiffany@tmtaxaccounting.com	\N	t	verified	t	tiffany-mcbride-user323	2025-08-31 17:46:04.962906+00	2025-08-31 18:18:57.845106+00	user_323w3HLnwNHqpUwA2Mh0tPbi5ia	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjN3M0dzS0lFT3lBR1d2Vmh5d0xTcFI1WjEifQ	tiffmcbride@gmail.com	{}	t	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
0334c0b3-2d26-4547-80e2-465d5139e88a	\N	Matthew	Brown	Tax Planner and Preparer	I am an EA and a Certified Tax Coach.  I have a great deal of experience and enjoy working with Individuals who own businesses and/or real estate. I also do 10+ S Corp Returns and a handful of C Corp Returns every year.  I'd really prefer not to do 1065s.  I have used Drake and OLTPro directly, and I have demoed a number of the other major platforms, like ProSeries.  I pick up new software quickly and would be happy to start on a trial basis if you have something new to me.	EA	\N	https://renewaltax.com/	https://www.linkedin.com/in/matthewbrownea/	Renewal Tax Services, LLC	8562441484	matt@renewaltax.com	\N	t	verified	t	matthew-brown-0334c0b3	2025-08-29 03:58:33.958401+00	2025-08-29 16:49:36.889744+00	user_31v0ceZMGbsxToINzOgenMVEDY1	\N	\N	{OLTPro,"Tax Help Software"}	t	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
1cb2f657-4610-458a-99fc-acf7506c2c6d	\N	Ago	Lajko	S corp specialist	S Works	Other	\N			S Works		ago@s-works.io	\N	t	pending_verification	f	ago-lajko-user31v	2025-08-29 16:29:10.824092+00	2025-09-01 00:03:25.753248+00	user_31vVDgO7d5cYIIMK7MHhBtmpk6P	\N	\N	{}	t	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
c8ed3e7c-1a2b-4a91-a5a8-b6318ea94280	\N	Scorpio	Tax Management	Scorpio Tax Management	small tax firm in California	EA	\N					tax@s-corptax.com	\N	t	verified	t	scorpio-tax-management-user329	2025-09-02 17:41:26.641273+00	2025-09-02 17:55:07.536414+00	user_329ZjgV2UXczVmPyjbbbku2MdAk	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjlaamRNa2FraVV2dkszYklpMkdCbDJNZVMifQ	tax@s-corptax.com	{"ProConnect by Intuit"}	t	f	f	\N	\N	\N	f	t	f	{}	\N	\N	\N	\N	{}	{}	{}	\N	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50		\N	\N
58236c15-a9d8-4e5b-9b79-1c3415bbec57	\N	Sahara	Carter	Sahara Carter, CPA	Experienced in 1040, 1120, 1120S, 1065, 1041, 990, 5471, other foreign, ASC 740. Worked for Moss Adams LLP as a preparer and Intuit as a software developer using AI to expedite preparation. Looking to pick up preparation part-time. Eight years total in tax preparation and tax software development. 	CPA	\N	www.coyoteledgers.com	https://www.linkedin.com/in/sahara-carter-cpa-87477b160	Coyote Ledgers 	8583498847	sahara@coyoteledgers.com	\N	t	verified	t	sahara-carter-user326	2025-09-01 15:03:13.637644+00	2025-09-01 15:31:55.717834+00	user_326RN4o0YK3nTRCkZCgOkgwZpk6	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjZSTjBNMDBLb3NqNjRibHhEaDBEWE9wVlYifQ	sahara@coyoteledgers.com	{Proconnect}	t	f	f	\N	\N	\N	t	f	f	{}	\N	\N	\N	\N	{}	{CA}	{}	\N	immediate	\N	{"city": "San Diego", "state": "CA", "country": "US", "display_name": null}	50	\N	\N	\N
57da36fd-e1ad-42f0-8484-faa0d0f80d4e	\N	Chasity	Lavergne	Tax Planning & Compliance	CPA with 25 years of experience practicing exclusively in tax at a small/boutique & mid-sized public accounting firm. 	CPA	\N				3372587718	chasitylav@outlook.com	\N	t	pending_verification	t	user-user326	2025-09-01 16:27:25.983742+00	2025-09-01 17:05:28.614416+00	user_326bbvN5fLBVGid2CXw49n1pIqd	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXQzMEJxUUlXVldvRlNUVlFPVENSb0VVRzkiLCJyaWQiOiJ1c2VyXzMyNmJidk41ZkxCVkdpZDJDWHc0OW4xcElxZCJ9	chasitylav@outlook.com	{"AssetKeeper; AdvanceFlow; Fixed Assets CS; GoFileRoom; Practice CS; CCH Engagement; Tic Tie Calculate"}	t	f	f	\N	\N	\N	t	f	f	{}	v1	2025-09-01 16:56:42.42+00	v1	2025-09-01 16:56:42.42+00	{}	{AL,AK,AZ,AR,CT,CO,FL,DE,ID,HI,GA,IA,IN,LA,KY,KS,IL,MA,MD,MS,MI,ME,MN,MO,NV,MT,NH,NE,NJ,NC,OK,RI,TN,VT,UT,SD,PA,OH,NM,SC,TX,OR,ND,WV,VA,WI,WA,WY}	{}	\N	immediate	\N	{"city": "Sunset", "state": "LA", "country": "US", "display_name": null}	50	\N	\N	\N
8fc33f51-43af-4bab-9516-fd31b5d9dcab	\N	Steven	Pollock	Steven Pollock		EA	\N	www.yourreason.com		Reason Financial	8584837500	steve@yourreason.com	\N	f	hidden	f	steven-pollock-user327	2025-09-01 22:14:33.96491+00	2025-09-01 22:21:46.52966+00	user_327HpJtnF2x4VKQ0RPZmaPLas4L	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjdIcEhKcVZaN3k5REptV2lJV0sxMGhndjIifQ	spollock02@gmail.com	{}	t	f	f	\N	\N	\N	f	t	f	{}	\N	\N	\N	\N	{}	{AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY}	{}	\N	immediate	\N	{"city": "San Diego", "state": "Ca", "country": "US", "display_name": null}	50	\N	\N	\N
031e2e2f-f9df-4a6e-a4dd-543a11bc5cc5	\N	Ira	Klein	Ira Klein	\N	Other	\N	\N	\N	\N	\N	ira@irakleincpa.com	\N	t	verified	f	ira-klein-031e2e2f	2025-08-29 02:32:33.880159+00	2025-08-29 16:49:36.889744+00	user_31wUi82aitt1nblVjaeTJGrPVBA	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMXdVaUExbzMxSFUzYWI0czhOdWdCbmhxUFUifQ	ira@irakleincpa.com	{}	f	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
a7df637f-5ba4-42a7-a84a-15b6c45fed00	\N	Kari	Hayes	Enrolled Agent	Enrolled Agent, systems geek, covered in dog fur	EA	\N	https://www.hayestaxsolutions.com		Hayes Tax Solutions	310-737-2873	kari@hayestaxsolutions.com	\N	t	verified	t	user-user327	2025-09-02 02:28:08.701657+00	2025-09-02 04:39:55.77349+00	user_327mfArqXsnXPHZ6AWAfKxZ6Wry	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXQzMEJxUUlXVldvRlNUVlFPVENSb0VVRzkiLCJyaWQiOiJ1c2VyXzMyN21mQXJxWHNuWFBIWjZBV0FmS3haNldyeSJ9	hayestaxsolutions@gmail.com	{IntuitProConnect}	t	f	f	\N	\N	\N	f	t	t	{US,CA,GB,MX,FR,ES,IT,IN,EG,QA,IL,JO,KW,LB}	v1	2025-09-02 02:28:39.547+00	v1	2025-09-02 02:28:39.547+00	{}	{}	{}	\N	immediate	\N	{"city": "Los Angeles", "state": "CA", "country": "US", "display_name": null}	50	Open to resolution and tax prep overflow projects, happy to help any way I can.	\N	\N
31290bd3-f403-4d32-9b76-f85f34f8e02b	\N	Gerardo	Ortiz Jr	Gerardo Ortiz Jr CPA	Hello, I am a CPA licensed in Texas. I work full time in industry but looking to do some tax prep work. Also if you are turning away clients, I'll be happy to help them. Have 4 years of experience doing high net worth individuals, partnerships, and S corp. 	Other	\N				8327368438	jerry@oo7cpa.com	\N	t	verified	t	gerardo-ortiz-user324	2025-08-31 23:19:24.169405+00	2025-09-01 00:04:32.824434+00	user_324aaURmYl4cvUn2T5cLAt7WM2D	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjRhYVNFcGR6OWsyWGFwYkZQVFprZEpYbzEifQ	ortiz.g7174@gmail.com	{}	t	f	f	\N	\N	\N	t	t	f	{}	\N	\N	\N	\N	{}	{TX}	{}	\N	immediate	\N	{"city": "Houston", "state": "Texas", "country": "VI", "display_name": null}	50	\N	\N	\N
3cdc111f-5874-4274-8db0-f69646c742c5	\N	New User		New User	\N	Other	\N	\N	\N	\N	\N	michael@tinsleytaxservices.com	\N	f	hidden	f	user-user329	2025-09-02 16:11:50.436174+00	2025-09-02 16:11:57.346577+00	user_329Oq02E4is7Furtn57XDr6it8f	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXQzMEJxUUlXVldvRlNUVlFPVENSb0VVRzkiLCJyaWQiOiJ1c2VyXzMyOU9xMDJFNGlzN0Z1cnRuNTdYRHI2aXQ4ZiJ9	michael@tinsleytaxservices.com	{}	f	f	f	\N	\N	\N	f	f	f	{}	v1	2025-09-02 16:11:57.133+00	v1	2025-09-02 16:11:57.133+00	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
2eb24616-3efc-4081-9a03-8b61aaff76e8	\N	John	Fahmy	John Fahmy	\N	Other	\N	\N	\N	\N	\N	johnthrives@gmail.com	\N	f	hidden	f	john-fahmy-user320	2025-08-30 14:54:58.423697+00	2025-08-30 14:54:58.423697+00	user_320m7UJ0idB5zqRiet7Tth32qps	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjBtN1RuMXdxT3hNTTBYZzhIMUN1TlM3b2QifQ	johnthrives@gmail.com	{}	f	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
56b9b9f9-c627-47c9-b21f-6e9141ea7abc	\N	New User		New User	\N	Other	\N	\N	\N	\N	\N	kosuoji@mail.roosevelt.edu	\N	f	pending_verification	f	user-user32	2025-09-02 22:57:27.499687+00	2025-09-03 00:01:04.500482+00	user_32ACAFn9wWPDtdaI3dPxmec8MD4	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMXQzMEJxUUlXVldvRlNUVlFPVENSb0VVRzkiLCJyaWQiOiJ1c2VyXzMyQUNBRm45d1dQRHRkYUkzZFB4bWVjOE1ENCJ9	kosuoji@mail.roosevelt.edu	{}	f	f	f	\N	\N	\N	f	f	f	{}	v1	2025-09-02 22:57:36.001+00	v1	2025-09-02 22:57:36.001+00	{}	{}	{}	{"frequency": "immediate", "job_notifications": true, "marketing_updates": false, "application_updates": true, "connection_requests": true, "verification_emails": true}	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	\N	\N	\N
f5003bd9-d1a2-4164-adb4-3cd70c6995e9	\N	Max	McKinney	CPA	7 years of experience in areas such as financial advisory, corporate finance, tax, and internal audit	CPA	\N			McKinney Pinnacle Financials	8168963112	mamckinney10@gmail.com	\N	f	hidden	t	new-user-user326	2025-09-01 17:40:12.945954+00	2025-09-01 17:45:32.127054+00	user_326kSBniwLEqLOz8OPB657FQjuq	\N	\N	{}	t	f	f	\N	\N	\N	f	t	f	{}	\N	\N	\N	\N	{}	{AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY}	{}	\N	immediate	\N	{"city": null, "state": "Arkansas", "country": "US", "display_name": null}	50	\N	\N	\N
f1813d5c-9ca7-4472-b444-1bf29e6a1b5a	\N	Pratipal	Shakya	Trusted Tax Advisor Specializing in U.S. Expat & Small Business Tax Solutions	I help individuals and entrepreneurs navigate complex U.S. tax obligations with clarity and confidence. My practice focuses on U.S. expats, self-employed professionals, and small business owners, providing year-round tax planning, compliance, and advisory services. With a client-first approach, I make sure every taxpayer receives practical guidance, accurate filings, and proactive strategies that minimize stress while maximizing savings.	CPA	\N	https://www.pcci.tax		Provide Clarity Consulting Inc.	5713995399	contact@provideclarity.com	\N	t	verified	t	paul-user329	2025-09-02 16:04:46.953124+00	2025-09-02 16:40:58.057981+00	user_329Nymd2VJidxbd7Le5NZucVwLe	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMjlOeWowamg4emdaMXF1SXBOSVd4UENqMGkifQ	paul@provideclarity.com	{}	t	f	f	\N	\N	\N	f	f	f	{}	\N	\N	\N	\N	{}	{}	{}	\N	immediate	\N	{"city": null, "state": null, "country": "US", "display_name": null}	50	International tax expertise	\N	\N
8123510e-0b15-46e9-b6d5-f7e1695bdadb	\N	Koen	Van Duyse	Builder of Tax Pro Exchange - CTEC Tax Preparer	Hi I am building this network for Tax Professionals. I also won and run Cardiff Tax Pros, a tax prep firm in Cardiff by the Sea, California.	CTEC	\N	https://www.cardifftax.com		Cardiff Tax Pros	6467509060	koen@cardifftax.com	\N	t	verified	t	koen-van-duyse-8123510e	2025-08-28 19:58:23.066082+00	2025-09-03 03:01:55.979258+00	user_31vbRPusrbzss2XTqCjveAMIkq8	\N	\N	{}	t	t	f	\N	\N	user_31vbRPusrbzss2XTqCjveAMIkq8	f	t	f	{}	v1	2025-08-29 23:28:04.873+00	v1	2025-08-29 23:28:04.873+00	{}	{AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY}	{}	\N	immediate	\N	{"city": "San Diego", "state": "CA", "country": "US", "display_name": null}	50		1-2	< $1M
\.


--
-- Data for Name: pros_saved_searches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pros_saved_searches (id, user_id, filters_json, notify_email, notify_sms, created_at) FROM stdin;
\.


--
-- Data for Name: reviews_firm_by_preparer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews_firm_by_preparer (id, job_id, reviewer_user_id, reviewee_user_id, ratings, comment, created_at) FROM stdin;
\.


--
-- Data for Name: reviews_preparer_by_firm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews_preparer_by_firm (id, job_id, reviewer_user_id, reviewee_profile_id, ratings, comment, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (session_token, user_id, expires) FROM stdin;
\.


--
-- Data for Name: specialization_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.specialization_groups (key, label) FROM stdin;
returns_entities	Returns & Entities
representation	Representation & Controversy
multistate_local	Multi-State & Local
international	International
industry	Industry Vertical
transactions_planning	Transactions & Planning
credits_incentives	Credits & Incentives
estate_gift_fiduciary	Estate, Gift & Fiduciary
nonprofit	Nonprofit & Exempt Orgs
bookkeeping_close	Bookkeeping & Close
payroll_contractor	Payroll & Contractor Compliance
disaster_special	Disaster & Special Situations
life_events	Life Events & Individuals
\.


--
-- Data for Name: specializations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.specializations (id, slug, label, created_at, group_key) FROM stdin;
df875873-1968-4d01-ba45-e0907215eedc	1040_individual	Individual (Form 1040)	2025-08-29 04:35:46.060733+00	returns_entities
58ac999a-bcf6-42f5-875a-4f18209efb86	1120s_s_corp	S-Corporation (1120-S)	2025-08-29 04:35:46.060733+00	returns_entities
e0762e26-be35-4b0e-9903-5a4da1e9cea7	1120_c_corp	C-Corporation (1120)	2025-08-29 04:35:46.060733+00	returns_entities
185835a1-7827-44df-bcb9-f800c50c360d	1065_partnership	Partnership (1065)	2025-08-29 04:35:46.060733+00	returns_entities
21ffc9b0-a0e8-4a96-b930-e95e71ff16fc	1041_trust_estate	Trust & Estate (1041)	2025-08-29 04:35:46.060733+00	returns_entities
87c1406b-7157-4257-8a99-1823d0c77f36	990_nonprofit	Nonprofit (990)	2025-08-29 04:35:46.060733+00	returns_entities
49588c9f-bfe6-4870-87a9-aab52daf7184	706_estate	Estate Tax (706)	2025-08-29 04:35:46.060733+00	returns_entities
98df2b3d-c0fb-4ac3-8125-8b49b844714d	709_gift	Gift Tax (709)	2025-08-29 04:35:46.060733+00	returns_entities
ac0ef074-f288-41fb-bb52-5ebcf9be3dce	payroll_941_940	Payroll (941/940)	2025-08-29 04:35:46.060733+00	returns_entities
00e480d0-82ba-4df3-ae56-1af9eff2874e	sales_excise_returns	Sales & Excise Returns	2025-08-29 04:35:46.060733+00	returns_entities
cfcd77f8-6c8d-46a9-9685-c5ffe5564d77	1099_information_reporting	1099 Information Reporting	2025-08-29 04:35:46.060733+00	returns_entities
f6c01a55-4ece-4012-8361-ccc3dac39c9d	irs_rep_exams_audits	IRS Exams & Audits	2025-08-29 04:35:46.060733+00	representation
3f9b068f-c558-486d-b950-1c505d37e616	collections_ia_oic	Collections (IA/OIC)	2025-08-29 04:35:46.060733+00	representation
f14e04dc-81b2-4ca6-b5a9-1562be00b28a	penalty_abatement	Penalty Abatement	2025-08-29 04:35:46.060733+00	representation
e5ce936f-b527-403d-92c5-0c06600b55e2	amended_returns	Amended Returns	2025-08-29 04:35:46.060733+00	representation
72483a23-830a-4122-868a-128c7546fb4f	notice_response_cp_letters	Notice Responses	2025-08-29 04:35:46.060733+00	representation
b7dc662c-cc13-46f4-812d-6b9bfc404861	payroll_tax_issue	Payroll Tax Issues	2025-08-29 04:35:46.060733+00	representation
3dd15712-71b8-4f8b-89bb-83db1670f507	trust_fund_recovery_penalty	TFRP Defense	2025-08-29 04:35:46.060733+00	representation
b3c0d37f-e39f-4c86-b2bb-7f4780bd68ec	multistate_apportionment	Apportionment (Multi-State)	2025-08-29 04:35:46.060733+00	multistate_local
4588632c-4f04-4886-93db-38d859e7f0f1	nexus_analysis	Nexus Analysis	2025-08-29 04:35:46.060733+00	multistate_local
6d7e6404-ed84-49d8-87f4-746237ae7f3d	state_franchise_gross_receipts	State Franchise/Gross Receipts	2025-08-29 04:35:46.060733+00	multistate_local
12f20f80-9bfe-4c39-b102-432d8704dc37	city_county_local_tax	City/County Local Tax	2025-08-29 04:35:46.060733+00	multistate_local
6d133cc5-ba2c-4961-82a5-fa7e75389e1e	ca_specific	California (CA)	2025-08-29 04:35:46.060733+00	multistate_local
8e215546-7b4a-4925-8b75-61a4299672c1	ny_specific	New York (NY)	2025-08-29 04:35:46.060733+00	multistate_local
d80df6ad-917a-43e7-8983-50f37e909cd4	tx_specific	Texas (TX)	2025-08-29 04:35:46.060733+00	multistate_local
4d096597-f895-47c6-b1a6-19cabab14e53	expat_inbound_outbound	Expat / Inbound-Outbound	2025-08-29 04:35:46.060733+00	international
76fb1bb2-5154-454e-ba60-bad34443d60a	fbar_fincen114	FBAR (FinCEN 114)	2025-08-29 04:35:46.060733+00	international
e72df86d-1cf2-4ee0-a2cb-6f9857b754dc	fatca_8938	FATCA (8938)	2025-08-29 04:35:46.060733+00	international
272003cb-04fb-4483-a1a8-ca2d6e1be3c9	foreign_tax_credit_1116	Foreign Tax Credit (1116)	2025-08-29 04:35:46.060733+00	international
535bddac-caa6-4213-bd36-8f0a06093866	foreign_earned_income_2555	Foreign Earned Income (2555)	2025-08-29 04:35:46.060733+00	international
5f4533a3-f47a-4511-b9fa-0e500f20ea26	5471_cfc	CFC (5471)	2025-08-29 04:35:46.060733+00	international
e667abcc-9b01-4222-b4eb-03af4ee21b8b	5472_fdi	Foreign-Owned US Corp (5472)	2025-08-29 04:35:46.060733+00	international
7d277d24-acf2-43b8-b632-b1c62447e2e6	8865_foreign_partnership	Foreign Partnership (8865)	2025-08-29 04:35:46.060733+00	international
b934ed5d-544d-4562-b0e8-41633bc37e48	8858_disregarded_foreign	Foreign Disregarded Entity (8858)	2025-08-29 04:35:46.060733+00	international
b8c06fa8-a5a2-4098-9884-001976d4e542	treaty_positions	Treaty Positions	2025-08-29 04:35:46.060733+00	international
02848c5b-60b7-48f1-ba6f-68e2d6a6e390	firpta_8288a	FIRPTA (8288-A)	2025-08-29 04:35:46.060733+00	international
216d195c-bc97-41af-b534-bfc7ce9fa5b1	itin	ITIN Processing	2025-08-29 04:35:46.060733+00	international
87c68262-017f-4403-bdcd-4e82b60d7922	real_estate_investors	Real Estate Investors	2025-08-29 04:35:46.060733+00	industry
74cf0472-9c37-4206-981a-2b17b138f285	short_term_rentals	Short-Term Rentals	2025-08-29 04:35:46.060733+00	industry
9bb7e1f1-021c-465f-b0bd-5b5156f338d4	construction_contractors	Construction & Contractors	2025-08-29 04:35:46.060733+00	industry
8c9226d8-caf4-4411-b373-80811e2233dd	healthcare_professionals	Healthcare Professionals	2025-08-29 04:35:46.060733+00	industry
0e3984d6-851c-46e7-b590-3c301c6e3560	ecommerce_marketplaces	E-commerce & Marketplaces	2025-08-29 04:35:46.060733+00	industry
cf523f75-e491-4c13-9d0d-e16c6542154f	crypto_defi_nft	Crypto / DeFi / NFT	2025-08-29 04:35:46.060733+00	industry
3fd7eea1-6296-4d81-b50f-fe4fa7152727	gig_economy_platforms	Gig Economy	2025-08-29 04:35:46.060733+00	industry
4f3a5d01-1922-489e-8503-249ae9c976ec	restaurants_food	Restaurants & Food	2025-08-29 04:35:46.060733+00	industry
13d944e4-4113-4bf3-b209-f60f20b851a3	trucking_logistics	Trucking & Logistics	2025-08-29 04:35:46.060733+00	industry
05a79bc9-e587-40ec-92c6-c6304415e07b	cannabis_state_compliant	Cannabis (State-Compliant)	2025-08-29 04:35:46.060733+00	industry
7de8d492-16dc-4eb3-a865-a7604be6ddd2	manufacturing	Manufacturing	2025-08-29 04:35:46.060733+00	industry
bb895f03-1566-44e9-894d-fcc91af98678	oil_gas	Oil & Gas	2025-08-29 04:35:46.060733+00	industry
969fedf1-eae4-403a-bd52-e96f7ef693d1	film_tv_section181	Film & TV (Sec. 181)	2025-08-29 04:35:46.060733+00	industry
9037ec36-2a9a-4962-bb62-9498005b1b1f	entity_selection_8832_2553	Entity Selection (8832/2553)	2025-08-29 04:35:46.060733+00	transactions_planning
e04978c3-152b-4e1b-aab4-ed06910026b1	s_election_2553	S-Election (2553)	2025-08-29 04:35:46.060733+00	transactions_planning
59d4644b-4f0f-4b96-9b48-33cb6b189a0c	m_and_a_structuring	M&A Structuring	2025-08-29 04:35:46.060733+00	transactions_planning
788b8127-617c-4ae8-aa7b-61c71eedb274	338h10_336e	338(h)(10)/336(e)	2025-08-29 04:35:46.060733+00	transactions_planning
ac0c947e-7d74-4782-ade5-4a2298846b8e	754_743b_adjustments	§754/§743(b) Adjustments	2025-08-29 04:35:46.060733+00	transactions_planning
63c1bdd5-61d7-4265-ab01-84d14744d0d2	1031_like_kind	1031 Exchanges	2025-08-29 04:35:46.060733+00	transactions_planning
817d5e99-0cf5-4113-8082-34ce8df30111	cost_segregation	Cost Segregation	2025-08-29 04:35:46.060733+00	transactions_planning
e3add338-6116-41ec-b77e-f85672c67ee5	qsbs_1202	QSBS (§1202)	2025-08-29 04:35:46.060733+00	transactions_planning
36785976-d24d-475b-b3d1-437a1ddac5a2	equity_comp_isos_nsos_rsus	Equity Comp (ISOs/NSOs/RSUs)	2025-08-29 04:35:46.060733+00	transactions_planning
76906a74-ce4c-4a14-85f4-c3b0be7fdf15	r_and_d_credit_6765	R&D Credit (6765)	2025-08-29 04:35:46.060733+00	transactions_planning
4fcdad16-a1d1-40b6-ac6a-fc7376c2551b	erc_review_support	ERC Review/Support	2025-08-29 04:35:46.060733+00	transactions_planning
991e9026-8b7e-4c03-8c25-db5951930056	nol_planning	NOL Planning	2025-08-29 04:35:46.060733+00	transactions_planning
21ac08e8-d4e3-43d7-9309-897ef9d2a4bc	salt_cap_workaround_passthrough	SALT Cap Workaround (PTET)	2025-08-29 04:35:46.060733+00	transactions_planning
6e6d353a-7f68-409e-b88b-82b2af8be02e	retirement_plans_sep_solo401k	Retirement Plans (SEP/Solo 401k)	2025-08-29 04:35:46.060733+00	transactions_planning
842f5cf9-20ed-4a8b-b4f4-537bf767acf4	estimated_tax_planning	Estimated Tax Planning	2025-08-29 04:35:46.060733+00	transactions_planning
e25b833e-ecd3-4264-82a2-2e50f5c8f0a9	eitc_ctc_actc	EITC/CTC/ACTC	2025-08-29 04:35:46.060733+00	credits_incentives
469ca13a-fd53-4753-8238-3cc1f7dac705	education_credits_aotc_llc	Education Credits (AOTC/LLC)	2025-08-29 04:35:46.060733+00	credits_incentives
c5ecdff9-f906-4743-8fb8-16df82a83f8d	energy_credits_5695_ev_8936	Home/EV Energy Credits	2025-08-29 04:35:46.060733+00	credits_incentives
1ed262f2-b4de-46da-a22c-4f8ee2cefbbb	45l_179d_building_efficiency	§45L/§179D Efficiency	2025-08-29 04:35:46.060733+00	credits_incentives
6e2a0c65-b61e-4450-9131-c8368647da35	wotc	WOTC	2025-08-29 04:35:46.060733+00	credits_incentives
c69c6591-e152-4089-9768-af427f8b886e	estate_admin_reporting	Estate Administration	2025-08-29 04:35:46.060733+00	estate_gift_fiduciary
b1264620-901c-4665-983d-f6b229171d6e	gift_reporting_planning	Gift Reporting & Planning	2025-08-29 04:35:46.060733+00	estate_gift_fiduciary
2d044403-5a29-4bcf-8c32-dfcd54d62a0d	portability_8971_basis_consistency	Portability & Basis Consistency	2025-08-29 04:35:46.060733+00	estate_gift_fiduciary
469e8169-cad2-4a80-a927-8eb0e91a018f	fiduciary_accounting	Fiduciary Accounting	2025-08-29 04:35:46.060733+00	estate_gift_fiduciary
e8d4259b-4459-4690-8637-4a35d9fb883c	1023_1024_application	Exemption (1023/1024)	2025-08-29 04:35:46.060733+00	nonprofit
a682f0a2-1fc6-409c-b5a7-38d5e68f1897	ubit_990t	UBIT (990-T)	2025-08-29 04:35:46.060733+00	nonprofit
14cc0fc7-2651-45bb-9c94-c1a7be5d925e	state_charity_registration	State Charity Registration	2025-08-29 04:35:46.060733+00	nonprofit
ba596a74-7b2e-44a9-bf90-cd418e33737d	qbo_xero_setup_cleanup	QBO/Xero Setup & Cleanup	2025-08-29 04:35:46.060733+00	bookkeeping_close
2c82641f-5dd5-4be6-8d81-c9fb6de0ee87	monthly_close_kpis	Monthly Close & KPIs	2025-08-29 04:35:46.060733+00	bookkeeping_close
d3a0abd4-4bad-4e69-b809-14cdf66168b7	inventory_job_costing	Inventory & Job Costing	2025-08-29 04:35:46.060733+00	bookkeeping_close
cbf47d3f-0d94-462c-aad8-569841318ce5	chart_of_accounts_design	Chart of Accounts Design	2025-08-29 04:35:46.060733+00	bookkeeping_close
85c11200-56f2-4b3c-bd2a-93179073bca0	payroll_setup_multistate	Payroll Setup & Multistate	2025-08-29 04:35:46.060733+00	payroll_contractor
67d53ce7-89ca-4c19-9a35-175b011af026	fringe_benefits_taxability	Fringe Benefits Taxability	2025-08-29 04:35:46.060733+00	payroll_contractor
bd439dfe-453a-4d33-86f1-887c9dfb8bca	1099_k_cp2100_b_notice_workflow	1099-K/CP2100(B) Workflows	2025-08-29 04:35:46.060733+00	payroll_contractor
f6732f18-79e2-423e-b778-64ef3fc93e49	casualty_disaster_relief	Casualty & Disaster Relief	2025-08-29 04:35:46.060733+00	disaster_special
cdea5428-afeb-4642-8169-e5fc4a8aa98f	injured_spouse_innocent_spouse	Injured/Innocent Spouse	2025-08-29 04:35:46.060733+00	disaster_special
fcb706c3-4474-445d-8c4e-dcdf0bbbf078	marriage_divorce_tax	Marriage/Divorce	2025-08-29 04:35:46.060733+00	life_events
78c39986-d1d0-4904-a193-469e0308f0c5	new_child_dependents	New Child & Dependents	2025-08-29 04:35:46.060733+00	life_events
5f0604d3-e14d-478f-9583-62db2c922054	home_purchase_sale	Home Purchase/Sale	2025-08-29 04:35:46.060733+00	life_events
bd525331-7e20-4d0e-96af-6936302f6c7a	education_savings_529	Education Savings (529)	2025-08-29 04:35:46.060733+00	life_events
6d6ebf64-4bf2-4ed8-b351-289b08a52048	retirement_income_ss_medicare	Retirement, SS & Medicare	2025-08-29 04:35:46.060733+00	life_events
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, email_verified, image) FROM stdin;
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
\.


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (provider, provider_account_id);


--
-- Name: audits audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audits
    ADD CONSTRAINT audits_pkey PRIMARY KEY (id);


--
-- Name: connections connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);


--
-- Name: connections connections_requester_profile_id_recipient_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_requester_profile_id_recipient_profile_id_key UNIQUE (requester_profile_id, recipient_profile_id);


--
-- Name: job_applications job_applications_job_id_applicant_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_job_id_applicant_profile_id_key UNIQUE (job_id, applicant_profile_id);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- Name: jobs_milestones jobs_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs_milestones
    ADD CONSTRAINT jobs_milestones_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: locations locations_country_state_city_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_country_state_city_key UNIQUE (country, state, city);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: notification_prefs notification_prefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_prefs
    ADD CONSTRAINT notification_prefs_pkey PRIMARY KEY (user_id);


--
-- Name: profile_locations profile_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_locations
    ADD CONSTRAINT profile_locations_pkey PRIMARY KEY (id);


--
-- Name: profile_locations profile_locations_profile_id_state_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_locations
    ADD CONSTRAINT profile_locations_profile_id_state_key UNIQUE (profile_id, state);


--
-- Name: profile_software profile_software_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_software
    ADD CONSTRAINT profile_software_pkey PRIMARY KEY (id);


--
-- Name: profile_software profile_software_profile_id_software_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_software
    ADD CONSTRAINT profile_software_profile_id_software_slug_key UNIQUE (profile_id, software_slug);


--
-- Name: profile_specializations profile_specializations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_specializations
    ADD CONSTRAINT profile_specializations_pkey PRIMARY KEY (id);


--
-- Name: profile_specializations profile_specializations_profile_id_specialization_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_specializations
    ADD CONSTRAINT profile_specializations_profile_id_specialization_slug_key UNIQUE (profile_id, specialization_slug);


--
-- Name: profiles profiles_clerk_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_clerk_id_unique UNIQUE (clerk_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_slug_unique UNIQUE (slug);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: pros_saved_searches pros_saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pros_saved_searches
    ADD CONSTRAINT pros_saved_searches_pkey PRIMARY KEY (id);


--
-- Name: reviews_firm_by_preparer reviews_firm_by_preparer_job_id_reviewer_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews_firm_by_preparer
    ADD CONSTRAINT reviews_firm_by_preparer_job_id_reviewer_user_id_key UNIQUE (job_id, reviewer_user_id);


--
-- Name: reviews_firm_by_preparer reviews_firm_by_preparer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews_firm_by_preparer
    ADD CONSTRAINT reviews_firm_by_preparer_pkey PRIMARY KEY (id);


--
-- Name: reviews_preparer_by_firm reviews_preparer_by_firm_job_id_reviewee_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews_preparer_by_firm
    ADD CONSTRAINT reviews_preparer_by_firm_job_id_reviewee_profile_id_key UNIQUE (job_id, reviewee_profile_id);


--
-- Name: reviews_preparer_by_firm reviews_preparer_by_firm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews_preparer_by_firm
    ADD CONSTRAINT reviews_preparer_by_firm_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (session_token);


--
-- Name: specialization_groups specialization_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialization_groups
    ADD CONSTRAINT specialization_groups_pkey PRIMARY KEY (key);


--
-- Name: specializations specializations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specializations
    ADD CONSTRAINT specializations_pkey PRIMARY KEY (id);


--
-- Name: specializations specializations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specializations
    ADD CONSTRAINT specializations_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token);


--
-- Name: idx_accounts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_user_id ON public.accounts USING btree (user_id);


--
-- Name: idx_audits_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audits_actor ON public.audits USING btree (actor_id);


--
-- Name: idx_audits_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audits_created ON public.audits USING btree (created_at);


--
-- Name: idx_audits_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audits_entity ON public.audits USING btree (entity_type, entity_id, action);


--
-- Name: idx_connections_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_recipient ON public.connections USING btree (recipient_profile_id);


--
-- Name: idx_connections_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_requester ON public.connections USING btree (requester_profile_id);


--
-- Name: idx_connections_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_status ON public.connections USING btree (status);


--
-- Name: idx_connections_stream_channel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_stream_channel_id ON public.connections USING btree (stream_channel_id);


--
-- Name: idx_job_applications_applicant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_applicant ON public.job_applications USING btree (applicant_profile_id);


--
-- Name: idx_job_applications_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_job_id ON public.job_applications USING btree (job_id);


--
-- Name: idx_job_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_status ON public.job_applications USING btree (status);


--
-- Name: idx_jobs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_created_at ON public.jobs USING btree (created_at);


--
-- Name: idx_jobs_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_created_by ON public.jobs USING btree (created_by);


--
-- Name: idx_jobs_deadline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_deadline ON public.jobs USING btree (deadline_date);


--
-- Name: idx_jobs_location_states; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_location_states ON public.jobs USING gin (location_states);


--
-- Name: idx_jobs_milestones_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_milestones_job_id ON public.jobs_milestones USING btree (job_id);


--
-- Name: idx_jobs_specialization_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_specialization_keys ON public.jobs USING gin (specialization_keys);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);


--
-- Name: idx_licenses_public_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_licenses_public_lookup ON public.licenses USING btree (profile_id, status) WHERE (status = 'verified'::text);


--
-- Name: idx_profile_locations_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_locations_profile_id ON public.profile_locations USING btree (profile_id);


--
-- Name: idx_profile_locations_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_locations_state ON public.profile_locations USING btree (state);


--
-- Name: idx_profile_locations_state_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_locations_state_city ON public.profile_locations USING btree (state, city);


--
-- Name: idx_profile_software_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_software_profile_id ON public.profile_software USING btree (profile_id);


--
-- Name: idx_profile_software_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_software_slug ON public.profile_software USING btree (software_slug);


--
-- Name: idx_profile_specializations_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_specializations_profile_id ON public.profile_specializations USING btree (profile_id);


--
-- Name: idx_profile_specializations_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_specializations_slug ON public.profile_specializations USING btree (specialization_slug);


--
-- Name: idx_profiles_accepting_work; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_accepting_work ON public.profiles USING btree (accepting_work);


--
-- Name: idx_profiles_clerk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_clerk_id ON public.profiles USING btree (clerk_id);


--
-- Name: idx_profiles_clerk_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_profiles_clerk_id_unique ON public.profiles USING btree (clerk_id);


--
-- Name: idx_profiles_clerk_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_clerk_user_id ON public.profiles USING btree (clerk_user_id);


--
-- Name: idx_profiles_countries; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_countries ON public.profiles USING gin (countries);


--
-- Name: idx_profiles_credential_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_credential_type ON public.profiles USING btree (credential_type);


--
-- Name: idx_profiles_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_deleted_at ON public.profiles USING btree (deleted_at);


--
-- Name: idx_profiles_email_preferences; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email_preferences ON public.profiles USING gin (email_preferences);


--
-- Name: idx_profiles_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_fts ON public.profiles USING gin (to_tsvector('english'::regconfig, ((((COALESCE(headline, ''::text) || ' '::text) || COALESCE(bio, ''::text)) || ' '::text) || COALESCE(firm_name, ''::text))));


--
-- Name: idx_profiles_is_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_admin ON public.profiles USING btree (is_admin);


--
-- Name: idx_profiles_is_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_deleted ON public.profiles USING btree (is_deleted);


--
-- Name: idx_profiles_is_listed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_listed ON public.profiles USING btree (is_listed);


--
-- Name: idx_profiles_onboarding_complete; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_onboarding_complete ON public.profiles USING btree (onboarding_complete);


--
-- Name: idx_profiles_primary_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_primary_location ON public.profiles USING gin (primary_location);


--
-- Name: idx_profiles_privacy_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_privacy_version ON public.profiles USING btree (privacy_version);


--
-- Name: idx_profiles_public_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_public_contact ON public.profiles USING btree (public_contact);


--
-- Name: idx_profiles_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_slug ON public.profiles USING btree (slug);


--
-- Name: idx_profiles_tos_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_tos_version ON public.profiles USING btree (tos_version);


--
-- Name: idx_profiles_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_trgm ON public.profiles USING gin ((((((headline || ' '::text) || COALESCE(bio, ''::text)) || ' '::text) || COALESCE(firm_name, ''::text))) public.gin_trgm_ops);


--
-- Name: idx_profiles_visibility_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_visibility_state ON public.profiles USING btree (visibility_state);


--
-- Name: idx_profiles_works_international; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_works_international ON public.profiles USING btree (works_international);


--
-- Name: idx_profiles_works_multistate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_works_multistate ON public.profiles USING btree (works_multistate);


--
-- Name: idx_reviews_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_job_id ON public.reviews_firm_by_preparer USING btree (job_id);


--
-- Name: idx_reviews_job_id_preparer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_job_id_preparer ON public.reviews_preparer_by_firm USING btree (job_id);


--
-- Name: idx_saved_searches_filters; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_searches_filters ON public.pros_saved_searches USING gin (filters_json);


--
-- Name: idx_saved_searches_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_searches_user ON public.pros_saved_searches USING btree (user_id);


--
-- Name: idx_sessions_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires ON public.sessions USING btree (expires);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_specializations_group_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_specializations_group_key ON public.specializations USING btree (group_key);


--
-- Name: idx_specializations_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_specializations_slug ON public.specializations USING btree (slug);


--
-- Name: idx_verification_tokens_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_tokens_expires ON public.verification_tokens USING btree (expires);


--
-- Name: profiles auto_generate_slug; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auto_generate_slug BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.generate_profile_slug();


--
-- Name: licenses trg_set_license_last4; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_license_last4 BEFORE INSERT OR UPDATE OF license_number ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.set_license_last4();


--
-- Name: connections update_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: job_applications update_job_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: licenses update_licenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: jobs_milestones validate_milestones_total_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_milestones_total_trigger AFTER INSERT OR UPDATE ON public.jobs_milestones FOR EACH ROW EXECUTE FUNCTION public.validate_milestones_total();


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: connections connections_recipient_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_recipient_profile_id_fkey FOREIGN KEY (recipient_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: connections connections_requester_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_requester_profile_id_fkey FOREIGN KEY (requester_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_applicant_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_applicant_profile_id_fkey FOREIGN KEY (applicant_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: jobs_milestones jobs_milestones_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs_milestones
    ADD CONSTRAINT jobs_milestones_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: licenses licenses_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_locations profile_locations_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_locations
    ADD CONSTRAINT profile_locations_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_software profile_software_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_software
    ADD CONSTRAINT profile_software_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_specializations profile_specializations_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_specializations
    ADD CONSTRAINT profile_specializations_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: reviews_firm_by_preparer reviews_firm_by_preparer_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews_firm_by_preparer
    ADD CONSTRAINT reviews_firm_by_preparer_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: reviews_preparer_by_firm reviews_preparer_by_firm_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews_preparer_by_firm
    ADD CONSTRAINT reviews_preparer_by_firm_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: reviews_preparer_by_firm reviews_preparer_by_firm_reviewee_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews_preparer_by_firm
    ADD CONSTRAINT reviews_preparer_by_firm_reviewee_profile_id_fkey FOREIGN KEY (reviewee_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: specializations specializations_group_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specializations
    ADD CONSTRAINT specializations_group_key_fkey FOREIGN KEY (group_key) REFERENCES public.specialization_groups(key);


--
-- Name: licenses admin_access_all_licenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_access_all_licenses ON public.licenses TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.is_admin = true)))));


--
-- Name: profiles admin_access_all_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_access_all_profiles ON public.profiles TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.is_admin = true)))));


--
-- Name: profiles admins_delete_all_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_delete_all_profiles ON public.profiles FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.is_admin = true)))));


--
-- Name: profiles admins_read_all_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_read_all_profiles ON public.profiles FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.is_admin = true)))));


--
-- Name: profiles admins_update_all_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_update_all_profiles ON public.profiles FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.is_admin = true)))));


--
-- Name: job_applications applicant can see own applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "applicant can see own applications" ON public.job_applications FOR SELECT USING (((applicant_user_id = public.clerk_user_id()) OR (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = job_applications.job_id) AND (j.created_by = public.clerk_user_id()))))));


--
-- Name: job_applications apply to job as self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "apply to job as self" ON public.job_applications FOR INSERT WITH CHECK ((applicant_user_id = public.clerk_user_id()));


--
-- Name: audits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

--
-- Name: connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

--
-- Name: connections connections_self_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY connections_self_insert ON public.connections FOR INSERT WITH CHECK ((requester_profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: connections connections_self_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY connections_self_read ON public.connections FOR SELECT USING (((requester_profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))) OR (recipient_profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid())))));


--
-- Name: connections connections_self_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY connections_self_update ON public.connections FOR UPDATE USING ((recipient_profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: jobs firms create jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "firms create jobs" ON public.jobs FOR INSERT WITH CHECK (public.can_post_jobs(public.clerk_user_id()));


--
-- Name: jobs firms delete own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "firms delete own jobs" ON public.jobs FOR DELETE USING ((created_by = public.clerk_user_id()));


--
-- Name: jobs firms update own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "firms update own jobs" ON public.jobs FOR UPDATE USING ((created_by = public.clerk_user_id())) WITH CHECK ((created_by = public.clerk_user_id()));


--
-- Name: jobs insert own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "insert own jobs" ON public.jobs FOR INSERT WITH CHECK ((created_by = public.clerk_user_id()));


--
-- Name: job_applications job owners manage applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "job owners manage applications" ON public.job_applications USING ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = job_applications.job_id) AND (jobs.created_by = public.clerk_user_id())))));


--
-- Name: job_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs_milestones job_owners_manage_milestones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY job_owners_manage_milestones ON public.jobs_milestones USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = jobs_milestones.job_id) AND (j.created_by = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))))));


--
-- Name: jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs_milestones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jobs_milestones ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_prefs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

--
-- Name: pros_saved_searches own_saved_searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY own_saved_searches ON public.pros_saved_searches USING (((user_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)));


--
-- Name: reviews_preparer_by_firm participants create preparer reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "participants create preparer reviews" ON public.reviews_preparer_by_firm FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.job_applications ja
     JOIN public.jobs j ON ((ja.job_id = j.id)))
  WHERE ((ja.job_id = reviews_preparer_by_firm.job_id) AND ((ja.applicant_user_id = public.clerk_user_id()) OR (j.created_by = public.clerk_user_id()))))));


--
-- Name: reviews_firm_by_preparer participants create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "participants create reviews" ON public.reviews_firm_by_preparer FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.job_applications ja
     JOIN public.jobs j ON ((ja.job_id = j.id)))
  WHERE ((ja.job_id = reviews_firm_by_preparer.job_id) AND ((ja.applicant_user_id = public.clerk_user_id()) OR (j.created_by = public.clerk_user_id()))))));


--
-- Name: notification_prefs prefs: owner read/write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "prefs: owner read/write" ON public.notification_prefs USING ((user_id = public.clerk_user_id())) WITH CHECK ((user_id = public.clerk_user_id()));


--
-- Name: job_applications preparers apply to jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "preparers apply to jobs" ON public.job_applications FOR INSERT WITH CHECK (public.can_apply_to_jobs(public.clerk_user_id()));


--
-- Name: profile_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_locations profile_locations_self_rw; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profile_locations_self_rw ON public.profile_locations USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = current_setting('app.clerk_user_id'::text, true)))));


--
-- Name: profile_software; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_software ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_software profile_software_self_rw; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profile_software_self_rw ON public.profile_software USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = current_setting('app.clerk_user_id'::text, true)))));


--
-- Name: profile_specializations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_specializations ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_specializations profile_specializations_self_rw; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profile_specializations_self_rw ON public.profile_specializations USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = current_setting('app.clerk_user_id'::text, true)))));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_allow_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_allow_all ON public.profiles USING (true);


--
-- Name: profiles profiles_read_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_read_public ON public.profiles FOR SELECT USING (((is_listed = true) AND (visibility_state = 'verified'::text)));


--
-- Name: profiles profiles_self_rw; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_rw ON public.profiles USING (((clerk_id IS NOT NULL) AND (clerk_id = current_setting('app.clerk_user_id'::text, true))));


--
-- Name: pros_saved_searches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pros_saved_searches ENABLE ROW LEVEL SECURITY;

--
-- Name: job_applications public read applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read applications" ON public.job_applications FOR SELECT USING (true);


--
-- Name: jobs public read jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read jobs" ON public.jobs FOR SELECT USING (true);


--
-- Name: reviews_preparer_by_firm public read preparer reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read preparer reviews" ON public.reviews_preparer_by_firm FOR SELECT USING (true);


--
-- Name: reviews_firm_by_preparer public read reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read reviews" ON public.reviews_firm_by_preparer FOR SELECT USING (true);


--
-- Name: profiles public_read_verified_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_verified_profiles ON public.profiles FOR SELECT TO anon USING (((is_deleted = false) AND (visibility_state = 'verified'::text) AND (is_listed = true)));


--
-- Name: audits read_audits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY read_audits ON public.audits FOR SELECT USING (true);


--
-- Name: reviews_preparer_by_firm reviews: firm about preparer - author can insert/select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "reviews: firm about preparer - author can insert/select" ON public.reviews_preparer_by_firm USING ((reviewer_user_id = public.clerk_user_id())) WITH CHECK ((reviewer_user_id = public.clerk_user_id()));


--
-- Name: reviews_firm_by_preparer reviews: preparer about firm - author can insert/select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "reviews: preparer about firm - author can insert/select" ON public.reviews_firm_by_preparer USING ((reviewer_user_id = public.clerk_user_id())) WITH CHECK ((reviewer_user_id = public.clerk_user_id()));


--
-- Name: reviews_firm_by_preparer; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews_firm_by_preparer ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews_preparer_by_firm; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews_preparer_by_firm ENABLE ROW LEVEL SECURITY;

--
-- Name: job_applications update own application; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "update own application" ON public.job_applications FOR UPDATE USING (((applicant_user_id = public.clerk_user_id()) OR (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = job_applications.job_id) AND (j.created_by = public.clerk_user_id())))))) WITH CHECK (true);


--
-- Name: jobs update own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "update own jobs" ON public.jobs FOR UPDATE USING ((created_by = public.clerk_user_id())) WITH CHECK ((created_by = public.clerk_user_id()));


--
-- Name: notification_prefs users manage own notification prefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users manage own notification prefs" ON public.notification_prefs USING ((user_id = public.clerk_user_id())) WITH CHECK ((user_id = public.clerk_user_id()));


--
-- Name: job_applications users update own applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users update own applications" ON public.job_applications FOR UPDATE USING ((applicant_user_id = public.clerk_user_id())) WITH CHECK ((applicant_user_id = public.clerk_user_id()));


--
-- Name: profiles users_access_own_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_access_own_profile ON public.profiles TO authenticated USING (((clerk_user_id = (auth.jwt() ->> 'sub'::text)) OR (id = auth.uid())));


--
-- Name: profiles users_read_own_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_read_own_profile ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) AND (is_deleted = false)));


--
-- Name: profiles users_update_own_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_own_profile ON public.profiles FOR UPDATE TO authenticated USING (((id = auth.uid()) AND (is_deleted = false)));


--
-- PostgreSQL database dump complete
--

