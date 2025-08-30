import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// POST /api/reviews - Submit a review
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, job_id, ratings, comment } = body;

    if (!type || !job_id || !ratings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = supabaseService();

    // Check if job exists and user has permission to review
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, created_by, status')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if there's a completed application
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('id, applicant_profile_id, applicant_user_id, status')
      .eq('job_id', job_id)
      .in('status', ['hired', 'completed'])
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'No completed application found for this job' }, { status: 400 });
    }

    if (type === 'firm') {
      // Preparer reviewing firm
      if (application.applicant_user_id !== userId) {
        return NextResponse.json({ error: 'Only the hired preparer can review the firm' }, { status: 403 });
      }

      // Check if already reviewed
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews_firm_by_preparer')
        .select('id')
        .eq('job_id', job_id)
        .eq('reviewer_user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Review check error:', checkError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      if (existingReview) {
        return NextResponse.json({ error: 'Already reviewed this firm for this job' }, { status: 400 });
      }

      // Create firm review
      const { data: review, error: reviewError } = await supabase
        .from('reviews_firm_by_preparer')
        .insert({
          job_id,
          reviewer_user_id: userId,
          reviewee_user_id: job.created_by,
          ratings,
          comment: comment || ''
        })
        .select()
        .single();

      if (reviewError) {
        console.error('Firm review creation error:', reviewError);
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
      }

      return NextResponse.json({ review }, { status: 201 });
    } else if (type === 'preparer') {
      // Firm reviewing preparer
      if (job.created_by !== userId) {
        return NextResponse.json({ error: 'Only the job creator can review the preparer' }, { status: 403 });
      }

      // Check if already reviewed
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews_preparer_by_firm')
        .select('id')
        .eq('job_id', job_id)
        .eq('reviewee_profile_id', application.applicant_profile_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Review check error:', checkError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      if (existingReview) {
        return NextResponse.json({ error: 'Already reviewed this preparer for this job' }, { status: 400 });
      }

      // Create preparer review
      const { data: review, error: reviewError } = await supabase
        .from('reviews_preparer_by_firm')
        .insert({
          job_id,
          reviewer_user_id: userId,
          reviewee_profile_id: application.applicant_profile_id,
          ratings,
          comment: comment || ''
        })
        .select()
        .single();

      if (reviewError) {
        console.error('Preparer review creation error:', reviewError);
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
      }

      return NextResponse.json({ review }, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Invalid review type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/reviews - Get reviews for a job or user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const userId = searchParams.get('user_id');

    if (!jobId && !userId) {
      return NextResponse.json({ error: 'job_id or user_id required' }, { status: 400 });
    }

    const supabase = supabaseService();

    if (jobId) {
      // Get reviews for a specific job
      const [firmReviews, preparerReviews] = await Promise.all([
        supabase
          .from('reviews_firm_by_preparer')
          .select(`
            *,
            profiles!reviews_firm_by_preparer_reviewer_user_id_fkey(
              first_name,
              last_name,
              slug
            )
          `)
          .eq('job_id', jobId),
        supabase
          .from('reviews_preparer_by_firm')
          .select(`
            *,
            profiles!reviews_preparer_by_firm_reviewer_user_id_fkey(
              first_name,
              last_name,
              firm_name,
              slug
            )
          `)
          .eq('job_id', jobId)
      ]);

      return NextResponse.json({
        firm_reviews: firmReviews.data || [],
        preparer_reviews: preparerReviews.data || []
      });
    } else if (userId) {
      // Get reviews for a specific user
      const [receivedFirmReviews, receivedPreparerReviews] = await Promise.all([
        supabase
          .from('reviews_firm_by_preparer')
          .select('*')
          .eq('reviewee_user_id', userId),
        supabase
          .from('reviews_preparer_by_firm')
          .select(`
            *,
            profiles!reviews_preparer_by_firm_reviewer_user_id_fkey(
              first_name,
              last_name,
              firm_name,
              slug
            )
          `)
          .eq('reviewee_profile_id', userId)
      ]);

      return NextResponse.json({
        received_firm_reviews: receivedFirmReviews.data || [],
        received_preparer_reviews: receivedPreparerReviews.data || []
      });
    }
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
