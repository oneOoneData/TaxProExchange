import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { SOLUTIONS } from '@/lib/constants/solutions';
import { siteUrl } from '@/lib/seo';
import { getAllPosts } from '@/lib/blog';

export const revalidate = 21600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();
  
  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/for-firms`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Solution pages
  SOLUTIONS.forEach((solution) => {
    routes.push({
      url: `${siteUrl}/solutions/${solution.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Top 30 prefiltered search entries (high-value search combinations)
  const searchPresets = [
    // State-specific SALT
    { query: 'specialization=multi_state&state=CA', label: 'SALT-CA' },
    { query: 'specialization=multi_state&state=TX', label: 'SALT-TX' },
    { query: 'specialization=multi_state&state=NY', label: 'SALT-NY' },
    { query: 'specialization=multi_state&state=FL', label: 'SALT-FL' },
    { query: 'specialization=multi_state&state=IL', label: 'SALT-IL' },
    
    // IRS Representation by state
    { query: 'specialization=irs_rep&state=CA', label: 'IRS-Rep-CA' },
    { query: 'specialization=irs_rep&state=TX', label: 'IRS-Rep-TX' },
    { query: 'specialization=irs_rep&state=NY', label: 'IRS-Rep-NY' },
    { query: 'specialization=irs_rep&state=FL', label: 'IRS-Rep-FL' },
    
    // Crypto tax
    { query: 'specialization=crypto', label: 'Crypto-Tax' },
    { query: 'specialization=crypto&state=CA', label: 'Crypto-CA' },
    { query: 'specialization=crypto&state=NY', label: 'Crypto-NY' },
    
    // Trusts & Estates
    { query: 'specialization=trusts_estates&state=CA', label: 'Trusts-CA' },
    { query: 'specialization=trusts_estates&state=FL', label: 'Trusts-FL' },
    { query: 'specialization=trusts_estates&state=NY', label: 'Trusts-NY' },
    
    // S-Corp and Partnership
    { query: 'specialization=1120s_s_corp&state=CA', label: 'S-Corp-CA' },
    { query: 'specialization=1120s_s_corp&state=TX', label: 'S-Corp-TX' },
    { query: 'specialization=partnership&state=CA', label: 'Partnership-CA' },
    { query: 'specialization=partnership&state=NY', label: 'Partnership-NY' },
    
    // Credential-based searches
    { query: 'credential_type=CPA&accepting_work=true', label: 'CPA-Available' },
    { query: 'credential_type=EA&accepting_work=true', label: 'EA-Available' },
    { query: 'credential_type=CPA&state=CA', label: 'CPA-CA' },
    { query: 'credential_type=CPA&state=TX', label: 'CPA-TX' },
    { query: 'credential_type=CPA&state=NY', label: 'CPA-NY' },
    { query: 'credential_type=EA&state=CA', label: 'EA-CA' },
    
    // Accepting work filters
    { query: 'accepting_work=true&state=CA', label: 'Available-CA' },
    { query: 'accepting_work=true&state=TX', label: 'Available-TX' },
    { query: 'accepting_work=true&state=NY', label: 'Available-NY' },
    { query: 'accepting_work=true&state=FL', label: 'Available-FL' },
  ];

  searchPresets.forEach((preset) => {
    // Next.js MetadataRoute.Sitemap handles URL encoding automatically
    // Don't manually encode & to &amp; as it will double-encode
    routes.push({
      url: `${siteUrl}/search?${preset.query}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    });
  });

  // Fetch latest 1,000 public profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('slug, updated_at')
    .eq('is_listed', true)
    .eq('visibility_state', 'verified')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (profiles) {
    profiles.forEach((profile) => {
      // Skip profiles with invalid slugs
      if (!profile.slug || typeof profile.slug !== 'string') {
        return;
      }
      
      // Ensure slug is URL-safe
      const safeSlug = profile.slug.trim();
      if (!safeSlug) {
        return;
      }
      
      // Validate date
      let lastModified: Date;
      if (profile.updated_at) {
        const date = new Date(profile.updated_at);
        lastModified = isNaN(date.getTime()) ? new Date() : date;
      } else {
        lastModified = new Date();
      }
      
      routes.push({
        url: `${siteUrl}/p/${safeSlug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.4,
      });
    });
  }

  // Blog posts
  const blogPosts = getAllPosts();
  blogPosts.forEach((post) => {
    // Skip posts with invalid slugs
    if (!post.slug || typeof post.slug !== 'string') {
      return;
    }
    
    // Use slug from frontmatter if available, otherwise construct from filename
    const slug = post.data.slug || `/ai/${post.slug}`;
    const url = slug.startsWith('http') ? slug : `${siteUrl}${slug.startsWith('/') ? slug : `/${slug}`}`;
    
    // Validate date
    let lastModified: Date;
    if (post.data.date) {
      const date = new Date(post.data.date);
      lastModified = isNaN(date.getTime()) ? new Date() : date;
    } else {
      lastModified = new Date();
    }
    
    routes.push({
      url,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  // Add AI blog index page
  routes.push({
    url: `${siteUrl}/ai`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  });

  // Add AI tools index page
  routes.push({
    url: `${siteUrl}/ai/tools`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  });

  // Fetch AI tools for dynamic routes
  const { data: aiTools } = await supabase
    .from('ai_tools')
    .select('slug, updated_at')
    .not('slug', 'is', null);

  if (aiTools) {
    aiTools.forEach((tool) => {
      // Skip tools with invalid slugs (already filtered with .not('slug', 'is', null), but double-check)
      if (!tool.slug || typeof tool.slug !== 'string') {
        return;
      }
      
      // Ensure slug is URL-safe
      const safeSlug = tool.slug.trim();
      if (!safeSlug) {
        return;
      }
      
      // Validate date
      let lastModified: Date;
      if (tool.updated_at) {
        const date = new Date(tool.updated_at);
        lastModified = isNaN(date.getTime()) ? new Date() : date;
      } else {
        lastModified = new Date();
      }
      
      routes.push({
        url: `${siteUrl}/ai/tools/${safeSlug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });
  }

  return routes;
}
