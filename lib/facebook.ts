const GRAPH_API = 'https://graph.facebook.com/v19.0';

function formatPayout(job: {
  payout_type: string;
  payout_fixed?: number;
  payout_min?: number;
  payout_max?: number;
}): string {
  switch (job.payout_type) {
    case 'fixed':
      return `$${job.payout_fixed?.toLocaleString()} fixed`;
    case 'hourly':
      return `$${job.payout_min}–$${job.payout_max}/hr`;
    case 'per_return':
      return `$${job.payout_min}–$${job.payout_max} per return`;
    default:
      return 'Payout to be discussed';
  }
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
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    console.warn('Facebook env vars not set — skipping post');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';
  const jobUrl = `${appUrl}/jobs/${job.id}`;

  const snippet = job.description.length > 180
    ? job.description.slice(0, 180).trimEnd() + '...'
    : job.description;

  const location = job.remote_ok
    ? 'Remote'
    : job.location_states?.length
      ? job.location_states.join(', ')
      : 'Location TBD';

  const credentials = job.credentials_required?.length
    ? `\nCredentials: ${job.credentials_required.join(', ')}`
    : '';

  const message = [
    `New tax job posted on TaxProExchange:`,
    ``,
    `${job.title}`,
    ``,
    snippet,
    ``,
    `Pay: ${formatPayout(job)}`,
    `Location: ${location}${credentials}`,
    ``,
    `Apply here: ${jobUrl}`,
    ``,
    `#TaxJobs #CPA #TaxPro #TaxProExchange`,
  ].join('\n');

  const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: token }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Facebook post failed: ${JSON.stringify(err)}`);
  }
}
