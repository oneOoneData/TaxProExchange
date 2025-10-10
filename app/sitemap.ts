import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.taxproexchange.com';
  const supabase = createServerClient();
  
  const { data } = await supabase
    .from('profiles')
    .select('slug, updated_at')
    .eq('is_listed', true)
    .eq('visibility_state', 'verified')
    .limit(10000);

  const staticPages: MetadataRoute.Sitemap = [
    { 
      url: `${base}/`, 
      changeFrequency: 'weekly', 
      priority: 1.0 
    },
    { 
      url: `${base}/search`, 
      changeFrequency: 'weekly', 
      priority: 0.8 
    },
    { 
      url: `${base}/trust`, 
      changeFrequency: 'monthly', 
      priority: 0.7 
    },
    { 
      url: `${base}/transparency`, 
      changeFrequency: 'monthly', 
      priority: 0.7 
    }
  ];

  const profilePages: MetadataRoute.Sitemap =
    (data ?? []).map(p => ({
      url: `${base}/p/${p.slug}`,
      lastModified: p.updated_at ?? new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.6
    }));

  return [...staticPages, ...profilePages];
}
