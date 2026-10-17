import { getSession } from '@/lib/auth';
import bus from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getSession();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const requested = new URL(req.url).searchParams.get('group') || '';
  const group = user.role === 'student' ? user.group : requested.trim().toUpperCase();
  if (!group) return new Response('Group required', { status: 400 });

  const enc = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (s) => {
        try { controller.enqueue(enc.encode(s)); } catch {}
      };
      const onMsg = (msg) => send(`data: ${JSON.stringify(msg)}\n\n`);
      const channel = `chat:${group}`;
      bus.on(channel, onMsg);
      send(': connected\n\n');
      const ping = setInterval(() => send(': ping\n\n'), 25000);
      cleanup = () => {
        clearInterval(ping);
        bus.off(channel, onMsg);
        try { controller.close(); } catch {}
      };
      req.signal.addEventListener('abort', cleanup);
    },
    cancel() { cleanup(); },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
