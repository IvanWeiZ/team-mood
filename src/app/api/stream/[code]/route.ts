import { redis } from "@/lib/redis";
import { KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const exists = await redis.exists(KEY.session(code));
  if (!exists) {
    return new Response("Session not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval>;
  let lastPayload = "";

  const stream = new ReadableStream({
    async start(controller) {
      const poll = async () => {
        try {
          const [counts, rawComments] = await Promise.all([
            redis.hgetall(KEY.mood(code)),
            redis.lrange(KEY.comments(code), 0, 49),
          ]);
          const comments = rawComments.map((c) => JSON.parse(c));
          const payload = JSON.stringify({ counts, comments });
          if (payload !== lastPayload) {
            lastPayload = payload;
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch {
          // client may have disconnected
        }
      };

      await poll();
      interval = setInterval(poll, 2000);
    },
    cancel() {
      clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
