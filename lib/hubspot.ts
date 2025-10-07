// HubSpot CRM integration for contact sync
// Uses Private App token with CRM scope

import { setTimeout as delay } from 'timers/promises';

const HUBSPOT_BASE = 'https://api.hubapi.com';
const HS_TOKEN = process.env.HUBSPOT_TOKEN;
const HS_API_KEY = process.env.HUBSPOT_API_KEY;

export type ContactProps = {
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  marketing_opt_in?: boolean;
};

/**
 * HubSpot fetch wrapper with automatic retry on rate limits and server errors
 * Supports both Private App tokens and API Keys
 */
async function hsFetch(path: string, init: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    // Build URL with API key if using legacy API key auth
    const url = HS_API_KEY 
      ? `${HUBSPOT_BASE}${path}${path.includes('?') ? '&' : '?'}hapikey=${HS_API_KEY}`
      : `${HUBSPOT_BASE}${path}`;
    
    // Build headers - use Bearer token for Private Apps, no auth header for API key
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> || {}),
    };
    
    if (HS_TOKEN) {
      headers.Authorization = `Bearer ${HS_TOKEN}`;
    }
    
    const res = await fetch(url, {
      ...init,
      headers,
    });

    // Retry on rate limit (429) or server errors (5xx)
    if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
      // Exponential backoff
      await delay(500 * (i + 1));
      continue;
    }
    return res;
  }
  
  // Final attempt without retry
  const url = HS_API_KEY 
    ? `${HUBSPOT_BASE}${path}${path.includes('?') ? '&' : '?'}hapikey=${HS_API_KEY}`
    : `${HUBSPOT_BASE}${path}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  };
  
  if (HS_TOKEN) {
    headers.Authorization = `Bearer ${HS_TOKEN}`;
  }
  
  return await fetch(url, {
    ...init,
    headers,
  });
}

/**
 * Upsert a HubSpot contact by email
 * - Searches for existing contact by email
 * - Updates if found, creates if not
 * - Sets custom property `tpe_marketing_opt_in` for list segmentation
 */
export async function upsertHubSpotContact(props: ContactProps) {
  const { email, firstname, lastname, marketing_opt_in } = props;
  
  if (!email) {
    return { ok: false, reason: 'missing_email' };
  }

  if (!HS_TOKEN && !HS_API_KEY) {
    console.warn('HUBSPOT_TOKEN or HUBSPOT_API_KEY not configured, skipping sync');
    return { ok: false, reason: 'not_configured' };
  }

  try {
    // 1) Search for existing contact by email
    const searchRes = await hsFetch('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }
            ]
          }
        ],
        properties: ['email'],
        limit: 1,
      }),
    });

    if (!searchRes.ok) {
      console.error('HubSpot search failed:', searchRes.status, await searchRes.text());
      return { ok: false, reason: 'search_failed', status: searchRes.status };
    }

    const searchData = await searchRes.json();

    // Prepare properties for HubSpot
    const hsProps: Record<string, any> = {
      email,
    };

    // Only include name fields if they have values
    if (firstname) hsProps.firstname = firstname;
    if (lastname) hsProps.lastname = lastname;

    // Custom property for marketing consent (create this property in HubSpot if needed)
    hsProps.tpe_marketing_opt_in = marketing_opt_in ?? false;

    // 2) Update existing contact or create new
    if (searchData?.total > 0) {
      const contactId = searchData.results[0].id;
      const updateRes = await hsFetch(`/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties: hsProps }),
      });

      if (!updateRes.ok) {
        console.error('HubSpot update failed:', updateRes.status, await updateRes.text());
        return { ok: false, reason: 'update_failed', status: updateRes.status };
      }

      const updateData = await updateRes.json();
      return { ok: true, data: updateData, op: 'update', contactId };
    }

    // 3) Create new contact
    const createRes = await hsFetch('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties: hsProps }),
    });

    if (!createRes.ok) {
      console.error('HubSpot create failed:', createRes.status, await createRes.text());
      return { ok: false, reason: 'create_failed', status: createRes.status };
    }

    const createData = await createRes.json();
    return { ok: true, data: createData, op: 'create', contactId: createData.id };
  } catch (error: any) {
    console.error('HubSpot upsert error:', error);
    return { ok: false, reason: 'exception', error: error?.message };
  }
}

