const GRAPH_API = 'https://graph.facebook.com/v19.0';

function formatPayout(job: {
  payout_type: string;
  payout_fixed?: number;
  payout_min?: number;
  payout_max?: number;
}): string {
  switch (job.payout_type) {
    case 'fixed':
      return `$${job.payout_fixed?.toLocaleString()} (fixed)`;
    case 'hourly':
      return `$${job.payout_min}–$${job.payout_max}/hr`;
    case 'per_return':
      return `$${job.payout_min}–$${job.payout_max} per return`;
    default:
      return 'To be discussed';
  }
}

async function postToTarget(targetId: string, token: string, message: string): Promise<void> {
  const res = await fetch(`${GRAPH_API}/${targetId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: token }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Facebook post to ${targetId} failed: ${JSON.stringify(err)}`);
  }
}

function buildJobMessage(job: {
  id: string;
  title: string;
  description: string;
  payout_type: string;
  payout_fixed?: number;
  payout_min?: number;
  payout_max?: number;
  remote_ok?: boolean;
  location_states?: string[];
  credentials_required?: string[];
}, jobUrl: string): string {
  const snippet = job.description.length > 220
    ? job.description.slice(0, 220).trimEnd() + '...'
    : job.description;

  const location = job.remote_ok
    ? 'Remote OK'
    : job.location_states?.length
      ? job.location_states.join(', ')
      : 'Location TBD';

  const credentials = job.credentials_required?.length
    ? `\nCredentials required: ${job.credentials_required.join(', ')}`
    : '';

  return [
    `New tax job just posted on TaxProExchange:`,
    ``,
    `${job.title}`,
    ``,
    snippet,
    ``,
    `Pay: ${formatPayout(job)}`,
    `Location: ${location}${credentials}`,
    ``,
    `If this sounds like a fit, view the full listing and apply directly — takes 2 minutes:`,
    `${jobUrl}`,
    ``,
    `TaxProExchange connects verified CPAs, EAs, and tax preparers for overflow work and referrals. Free to join.`,
    ``,
    `#TaxJobs #CPA #EA #TaxPreparer #TaxProExchange #Hiring #TaxFirm`,
  ].join('\n');
}

export async function postJobToFacebook(job: {
  id: string;
  title: string;
  description: string;
  payout_type: string;
  payout_fixed?: number;
  payout_min?: number;
  payout_max?: number;
  remote_ok?: boolean;
  location_states?: string[];
  credentials_required?: string[];
}): Promise<void> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const groupToken = process.env.FACEBOOK_USER_TOKEN; // user token needed for groups
  const groupIds = process.env.FACEBOOK_GROUP_IDS?.split(',').map(id => id.trim()).filter(Boolean) ?? [];

  if (!pageId || !pageToken) {
    console.warn('Facebook env vars not set — skipping post');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';
  const jobUrl = `${appUrl}/jobs/${job.id}`;
  const message = buildJobMessage(job, jobUrl);

  // Post to Page
  await postToTarget(pageId, pageToken, message);
  console.log(`Posted job ${job.id} to Facebook Page ${pageId}`);

  // Post to Groups (requires FACEBOOK_USER_TOKEN + FACEBOOK_GROUP_IDS)
  if (groupToken && groupIds.length > 0) {
    for (const groupId of groupIds) {
      try {
        await postToTarget(groupId, groupToken, message);
        console.log(`Posted job ${job.id} to Facebook Group ${groupId}`);
      } catch (err) {
        console.error(`Failed to post to group ${groupId}:`, err);
      }
    }
  }
}
