import { NextResponse } from 'next/server';
import { getDirectoryTools } from '@/lib/aiTools';

export const revalidate = 300;

// GET /api/ai-tools - All AI tools with vote counts, Reddit mention counts and sentiment
export async function GET() {
  try {
    const tools = await getDirectoryTools();
    tools.sort((a, b) => b.votes - a.votes || b.reviewCount - a.reviewCount);
    return NextResponse.json(
      { tools },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error) {
    console.error('Error in GET /api/ai-tools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
