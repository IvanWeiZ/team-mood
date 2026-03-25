import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { MOODS, SESSION_TTL, MAX_COMMENT_LENGTH, KEY } from "@/lib/constants";

const validMoods = MOODS.map((m) => m.key);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const exists = await redis.exists(KEY.session(code));
  if (!exists) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await request.json();
  const { mood, comment } = body;

  if (!mood || !validMoods.includes(mood)) {
    return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
  }

  const pipe = redis.pipeline();
  pipe.hincrby(KEY.mood(code), mood, 1);
  pipe.expire(KEY.mood(code), SESSION_TTL);

  if (comment && typeof comment === "string" && comment.trim().length > 0) {
    const trimmed = comment.trim().slice(0, MAX_COMMENT_LENGTH);
    const entry = JSON.stringify({
      mood,
      text: trimmed,
      ts: Date.now(),
    });
    pipe.lpush(KEY.comments(code), entry);
    pipe.ltrim(KEY.comments(code), 0, 99);
    pipe.expire(KEY.comments(code), SESSION_TTL);
  }

  await pipe.exec();

  return NextResponse.json({ success: true });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const exists = await redis.exists(KEY.session(code));
  if (!exists) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const [counts, rawComments] = await Promise.all([
    redis.hgetall(KEY.mood(code)),
    redis.lrange(KEY.comments(code), 0, 49),
  ]);
  const comments = rawComments.map((c) => JSON.parse(c));

  return NextResponse.json({ counts, comments });
}
