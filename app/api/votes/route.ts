import {supabaseAdmin} from '@/lib/supabase';
import {prisma} from '@/prisma/client';
import {NextResponse} from 'next/server';

// export async function GET(request: Request) {
//  // For example, fetch data from your DB here
//  const users = [
//   {id: 1, name: 'Alice'},
//   {id: 2, name: 'Bob'},
//  ];
//  return new Response(JSON.stringify(users), {
//   status: 200,
//   headers: {'Content-Type': 'application/json'},
//  });
// }

// export async function GET() {
//  try {
//   //   const votes = await prisma.vote.findMany({
//   //    orderBy: {side: 'asc'},
//   //   });

//   const {data: supabaseUsers, error} = await supabaseAdmin
//    .from('votes')
//    .select('*');
//   return NextResponse.json(supabaseUsers);
//  } catch (error) {
//   console.error('Get votes error:', error);
//   return NextResponse.json({error: 'Failed to fetch votes'}, {status: 500});
//  }
// }

export const dynamic = 'force-dynamic';

export async function GET() {
 try {
  const {data: votes, error} = await supabaseAdmin.from('Vote').select('*');
  //    .order('side', {ascending: true});
  console.log(votes);
  if (error) {
   console.error('Fetch votes error:', error);
   return NextResponse.json({error: 'Failed to fetch votes'}, {status: 500});
  }

  return NextResponse.json(votes);
 } catch (error) {
  console.error('Get votes error:', error);
  return NextResponse.json({error: 'Internal server error'}, {status: 500});
 }
}
