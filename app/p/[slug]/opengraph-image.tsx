import { ImageResponse } from 'next/og';
import { createServerClient } from '@/lib/supabase/server';

export const alt = 'Profile OG';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('first_name,last_name,credential_type,headline,avatar_url,is_listed,visibility_state')
    .eq('slug', slug)
    .single();

  if (!data || !data.is_listed || data.visibility_state !== 'verified') {
    return new ImageResponse(
      (
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          height: '100%', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ 
            textAlign: 'center',
            color: '#64748b',
            fontSize: 24
          }}>
            Profile not found
          </div>
        </div>
      ),
      size
    );
  }

  const name = `${data.first_name} ${data.last_name}, ${data.credential_type}`;

  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: '48px',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ 
            fontSize: 54, 
            fontWeight: 700, 
            color: '#0f172a',
            marginBottom: 12
          }}>
            {name}
          </div>
          <div style={{ 
            marginTop: 12, 
            fontSize: 28, 
            color: '#475569',
            marginBottom: 24
          }}>
            {data.headline ?? 'Verified Tax Professional'}
          </div>
          <div style={{ 
            marginTop: 24, 
            fontSize: 24,
            color: '#64748b',
            fontWeight: 500
          }}>
            TaxProExchange.com
          </div>
        </div>
        <div style={{ 
          width: 180, 
          height: 180, 
          borderRadius: 9999, 
          background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', 
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          fontWeight: 600,
          color: '#64748b'
        }}>
          {data.first_name[0]}{data.last_name[0]}
        </div>
      </div>
    ),
    size
  );
}
