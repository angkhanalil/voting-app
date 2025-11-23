import {supabaseAdmin} from '@/lib/supabase';
import {prisma} from '@/prisma/client';
import {NextRequest, NextResponse} from 'next/server';

const rateLimitMap = new Map<string, number[]>();
export async function GET(req: NextRequest) {
 const {data, error} = await supabaseAdmin.from('Vote').select('*');

 if (error) {
  return NextResponse.json({error: error.message}, {status: 500});
 }
 //  const votesMap = data.reduce((acc, vote) => {
 //   acc[vote.side] = vote.count;
 //   return acc;
 //  }, {} as Record<string, number>);

 return NextResponse.json(data);
}

function checkRateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
 const now = Date.now();
 const timestamps = rateLimitMap.get(ip) || [];

 // ลบ timestamp ที่เก่ากว่า window
 const validTimestamps = timestamps.filter((t) => now - t < windowMs);

 if (validTimestamps.length >= limit) {
  return false; // เกินจำกัด
 }

 validTimestamps.push(now);
 rateLimitMap.set(ip, validTimestamps);
 return true;
}

export async function POST(request: NextRequest) {
 try {
  // Get IP for rate limiting
  const ip =
   request.headers.get('x-forwarded-for') ||
   request.headers.get('x-real-ip') ||
   'unknown';

  // Rate limiting: 10 votes per minute
  if (!checkRateLimit(ip, 10, 60000)) {
   return NextResponse.json(
    {error: 'Too many requests. Please try again later.'},
    {status: 429}
   );
  }

  const {side} = await request.json();

  // Validate input
  if (!side || !['teamA', 'teamB'].includes(side)) {
   return NextResponse.json(
    {error: 'Invalid side. Must be teamA or teamB'},
    {status: 400}
   );
  }

  // Get current vote count
  const {data: currentVote, error: fetchError} = await supabaseAdmin
   .from('Vote')
   .select('count')
   .eq('side', side)
   .maybeSingle();

  if (fetchError) {
   console.error('Fetch error:', fetchError);
   return NextResponse.json(
    {error: 'Failed to fetch current vote'},
    {status: 500}
   );
  }

  const newCount = (currentVote?.count || 0) + 1;

  const {data: vote, error: updateError} = await supabaseAdmin
   .from('Vote')
   .upsert(
    {
     side,
     count: newCount,
     updatedAt: new Date().toISOString(),
    },
    {onConflict: 'side'}
   )
   .select()
   .single();

  if (updateError) {
   console.error('Update error:', updateError);
   return NextResponse.json({error: 'Failed to update vote'}, {status: 500});
  }

  // Log the vote
  await supabaseAdmin.from('VoteLog').insert({
   side,
   ipAddress: ip,
   timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
   success: true,
   vote,
  });
 } catch (error) {
  console.error('Vote error:', error);
  return NextResponse.json({error: 'Internal server error'}, {status: 500});
 }
}
