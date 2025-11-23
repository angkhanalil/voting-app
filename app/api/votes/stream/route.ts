import {supabaseAdmin} from '@/lib/supabase';
import {NextRequest} from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
 const encoder = new TextEncoder();

 let intervalId: NodeJS.Timeout;

 const stream = new ReadableStream({
  async start(controller) {
   // ส่งข้อมูลเริ่มต้น
   try {
    const {data: votes} = await supabaseAdmin.from('Vote').select('*');

    if (votes) {
     const data = votes.reduce((acc, vote) => {
      acc[vote.side] = vote.count;
      return acc;
     }, {} as Record<string, number>);

     controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    }
   } catch (error) {
    console.error('SSE initial error:', error);
   }

   // Poll ทุก 2 วินาที
   intervalId = setInterval(async () => {
    try {
     const {data: votes} = await supabaseAdmin.from('Vote').select('*');

     if (votes) {
      const data = votes.reduce((acc, vote) => {
       acc[vote.side] = vote.count;
       return acc;
      }, {} as Record<string, number>);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
     }
    } catch (error) {
     console.error('SSE poll error:', error);
    }
   }, 2000);

   // Cleanup เมื่อ connection ปิด
   request.signal.addEventListener('abort', () => {
    clearInterval(intervalId);
    controller.close();
   });
  },

  cancel() {
   clearInterval(intervalId);
  },
 });

 return new Response(stream, {
  headers: {
   'Content-Type': 'text/event-stream',
   'Cache-Control': 'no-cache, no-transform',
   Connection: 'keep-alive',
   'X-Accel-Buffering': 'no',
  },
 });
}
