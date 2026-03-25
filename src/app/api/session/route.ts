import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { SESSION_TTL, CODE_LENGTH, KEY } from "@/lib/constants";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST() {
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) {
      return NextResponse.json(
        { error: "Failed to generate unique code" },
        { status: 500 },
      );
    }
  } while (await redis.exists(KEY.session(code)));

  await redis.set(KEY.session(code), "1", "EX", SESSION_TTL);
  return NextResponse.json({ code });
}
