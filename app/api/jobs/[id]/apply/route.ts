import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';
import { getServerStreamClient } from '@/lib/stream';

export const dynamic = 'force-dynamic';

// POST /api/jobs/[id]/apply - Apply to a job
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = await params;
    const body = await request.json();
    const { cover_note, proposed_rate, proposed_payout_type, proposed_timeline } = body;

    const supabase = supabaseService();

    // Check if user can apply (verified preparer)
    // First, try to get the user's email from Clerk
    let userEmail: string | null = null;
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.primary_email_address_id && userData.email_addresses) {
          const primaryEmail = userData.email_addresses.find((e: any) => e.id === userData.primary_email_address_id);
          if (primaryEmail) {
            userEmail = primaryEmail.email_address;
          }
        } else if (userData.email_addresses && userData.email_addresses.length > 0) {
          userEmail = userData.email_addresses[0].email_address;
        }
      }
    } catch (error) {
      console.log('🔍 Could not fetch email from Clerk, will use clerk_id lookup:', error);
    }
    
    console.log('🔍 User email from Clerk:', userEmail);
    
    // Try to find profile by email first (more reliable across environments)
    let profile = null;
    let profileError = null;
    
    if (userEmail) {
      console.log('🔍 Searching for profile by email:', userEmail);
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('id, visibility_state, first_name, last_name, headline')
        .eq('public_email', userEmail)
        .single();
      
      if (emailProfile) {
        console.log('🔍 Profile found by email:', emailProfile.id);
        profile = emailProfile;
      } else if (emailError && emailError.code !== 'PGRST116') {
        console.error('🔍 Error searching by email:', emailError);
      }
    }
    
    // If no profile found by email, try by clerk_id
    if (!profile) {
      console.log('🔍 Searching for profile by clerk_id:', userId);
      const { data: clerkProfile, error: clerkError } = await supabase
        .from('profiles')
        .select('id, visibility_state, first_name, last_name, headline')
        .eq('clerk_id', userId)
        .single();
      
      profile = clerkProfile;
      profileError = clerkError;
    }

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.visibility_state !== 'verified') {
      return NextResponse.json({ error: 'Only verified profiles can apply to jobs' }, { status: 403 });
    }

    // Check if job exists and is open
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, created_by, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'open') {
      return NextResponse.json({ error: 'Job is not accepting applications' }, { status: 400 });
    }

    // Prevent applying to own job
    if (job.created_by === userId) {
      return NextResponse.json({ error: 'Cannot apply to your own job' }, { status: 400 });
    }

    // Check if already applied
    const { data: existingApplication, error: checkError } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_profile_id', profile.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Application check error:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingApplication) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 });
    }

    // Create the application
    const { data: application, error: applicationError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        applicant_profile_id: profile.id,
        applicant_user_id: userId,
        cover_note: cover_note || '',
        proposed_rate: proposed_rate || null,
        proposed_payout_type: proposed_payout_type || null,
        proposed_timeline: proposed_timeline || '',
        status: 'applied'
      })
      .select()
      .single();

    if (applicationError) {
      console.error('Application creation error:', applicationError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // Auto-connect: Create connection between job poster and applicant
    try {
      // Get job poster's profile ID
      const { data: jobPosterProfile, error: jobPosterError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', job.created_by)
        .single();

      if (!jobPosterError && jobPosterProfile) {
        // Check if connection already exists
        const { data: existingConnection } = await supabase
          .from('connections')
          .select('id, status, stream_channel_id, requester_profile_id, recipient_profile_id')
          .or(`and(requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${jobPosterProfile.id}),and(requester_profile_id.eq.${jobPosterProfile.id},recipient_profile_id.eq.${profile.id})`)
          .single();

        // Create connection if it doesn't exist
        if (!existingConnection) {
          const { data: connection, error: connectionError } = await supabase
            .from('connections')
            .insert({
              requester_profile_id: profile.id, // Applicant initiates the connection
              recipient_profile_id: jobPosterProfile.id,
              status: 'accepted' // Auto-accept since they're applying to their job
            })
            .select()
            .single();

          if (connectionError) {
            console.error('Auto-connect creation error:', connectionError);
            // Don't fail the application if connection creation fails
          } else {
            console.log('Auto-connect created:', connection.id);
            
            // Create Stream Chat channel for the auto-accepted connection
            try {
              console.log('Creating Stream Chat channel for auto-connect:', connection.id);
              
              // Check if Stream environment variables are set
              if (!process.env.STREAM_KEY || !process.env.STREAM_SECRET) {
                console.warn('Stream Chat environment variables not set, skipping channel creation');
              } else {
                const streamClient = getServerStreamClient();
                
                // Get both participant profile IDs
                const memberA = String(connection.requester_profile_id);
                const memberB = String(connection.recipient_profile_id);
                
                // Get profile information for both users
                const { data: profiles, error: profilesError } = await supabase
                  .from('profiles')
                  .select('id, first_name, last_name, avatar_url')
                  .in('id', [memberA, memberB]);
                
                if (!profilesError && profiles && profiles.length === 2) {
                  // Create/update user objects in Stream Chat
                  for (const profile of profiles) {
                    await streamClient.upsertUser({
                      id: profile.id,
                      name: `${profile.first_name} ${profile.last_name}`,
                      image: profile.avatar_url,
                    });
                  }
                  
                  console.log('Stream users created/updated for:', profiles.map(p => p.id));
                  
                  // Create a unique channel ID for this connection
                  const channelId = `conn_${connection.id}`;
                  
                  console.log('Creating channel with members:', { memberA, memberB, channelId });
                  
                  // Create the Stream channel
                  const channel = streamClient.channel('messaging', channelId, {
                    created_by_id: memberA,
                    members: [memberA, memberB],
                  });
                  
                  await channel.create();
                  console.log('Stream channel created successfully:', channel.id);
                  
                  // Update connection with Stream channel ID
                  const { data: saved, error: saveError } = await supabase
                    .from('connections')
                    .update({ stream_channel_id: channel.id })
                    .eq('id', connection.id)
                    .select()
                    .single();
                  
                  if (saveError) {
                    console.error('Failed to save Stream channel ID:', saveError);
                  } else {
                    console.log('Stream channel ID saved to database:', channel.id);
                  }
                } else {
                  console.error('Failed to fetch profile information for Stream users');
                }
              }
            } catch (streamError) {
              console.error('Stream Chat channel creation error:', streamError);
              // Don't fail the application if Stream channel creation fails
            }
          }
        } else if (existingConnection && existingConnection.status === 'accepted' && !existingConnection.stream_channel_id) {
          // Connection exists and is accepted but doesn't have a Stream channel
          console.log('Existing connection found without Stream channel, creating one:', existingConnection.id);
          
          try {
            // Check if Stream environment variables are set
            if (!process.env.STREAM_KEY || !process.env.STREAM_SECRET) {
              console.warn('Stream Chat environment variables not set, skipping channel creation');
            } else {
              const streamClient = getServerStreamClient();
              
              // Get both participant profile IDs
              const memberA = String(existingConnection.requester_profile_id);
              const memberB = String(existingConnection.recipient_profile_id);
              
              // Get profile information for both users
              const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .in('id', [memberA, memberB]);
              
              if (!profilesError && profiles && profiles.length === 2) {
                // Create/update user objects in Stream Chat
                for (const profile of profiles) {
                  await streamClient.upsertUser({
                    id: profile.id,
                    name: `${profile.first_name} ${profile.last_name}`,
                    image: profile.avatar_url,
                  });
                }
                
                console.log('Stream users created/updated for existing connection:', profiles.map(p => p.id));
                
                // Create a unique channel ID for this connection
                const channelId = `conn_${existingConnection.id}`;
                
                console.log('Creating channel for existing connection with members:', { memberA, memberB, channelId });
                
                // Create the Stream channel
                const channel = streamClient.channel('messaging', channelId, {
                  created_by_id: memberA,
                  members: [memberA, memberB],
                });
                
                await channel.create();
                console.log('Stream channel created successfully for existing connection:', channel.id);
                
                // Update connection with Stream channel ID
                const { data: saved, error: saveError } = await supabase
                  .from('connections')
                  .update({ stream_channel_id: channel.id })
                  .eq('id', existingConnection.id)
                  .select()
                  .single();
                
                if (saveError) {
                  console.error('Failed to save Stream channel ID for existing connection:', saveError);
                } else {
                  console.log('Stream channel ID saved to database for existing connection:', channel.id);
                }
              } else {
                console.error('Failed to fetch profile information for existing connection Stream users');
              }
            }
          } catch (streamError) {
            console.error('Stream Chat channel creation error for existing connection:', streamError);
            // Don't fail the application if Stream channel creation fails
          }
        }
      }
    } catch (autoConnectError) {
      console.error('Auto-connect error:', autoConnectError);
      // Don't fail the application if auto-connect fails
    }

    // Send notification email to job poster about new application
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/job-application-received`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
        },
        body: JSON.stringify({
          job_id: jobId,
          application_id: application.id,
          job_title: job.title,
          applicant_name: `${profile.first_name} ${profile.last_name}`,
          applicant_headline: profile.headline || 'Tax Professional',
          cover_note: cover_note || '',
          proposed_rate: proposed_rate || null,
          proposed_timeline: proposed_timeline || null
        }),
      });
    } catch (emailError) {
      console.error('Failed to send application notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Job application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/jobs/[id]/apply - Get applications for a job (job owner only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = await params;
    const supabase = supabaseService();

    // Check if user owns this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('created_by')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get applications with applicant details
    const { data: applications, error: applicationsError } = await supabase
      .from('job_applications')
      .select(`
        *,
        profiles!job_applications_applicant_profile_id_fkey(
          first_name,
          last_name,
          headline,
          credential_type,
          slug
        )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Applications fetch error:', applicationsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      applications: applications?.map(app => ({
        ...app,
        applicant: {
          name: `${app.profiles?.first_name} ${app.profiles?.last_name}`,
          headline: app.profiles?.headline,
          credential_type: app.profiles?.credential_type,
          slug: app.profiles?.slug
        }
      })) || []
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
