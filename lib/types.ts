export type MentorshipPrefs = {
  id?: string;
  profile_id: string;
  is_open_to_mentor: boolean;
  is_seeking_mentor: boolean;
  topics: string[];
  software: string[];
  specializations: string[];
  mentoring_message?: string | null;
  timezone?: string | null;
  updated_at?: string;
};

export const MENTORSHIP_TOPICS = [
  "s_corp", "c_corp", "partnership", "sole_prop", "multi_state", "international",
  "real_estate", "crypto", "irs_rep", "sales_tax", "bookkeeping",
  "practice_management", "marketing", "pricing",
  "software_proseries", "software_drake", "software_proconnect", "software_lacerte", "software_ultratax"
] as const;
