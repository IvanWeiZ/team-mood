import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis
vi.mock("@/lib/redis", () => ({
  redis: {
    exists: vi.fn(),
    hgetall: vi.fn(),
    lrange: vi.fn(),
  },
}));

import { GET } from "@/app/api/stream/[code]/route";
import { redis } from "@/lib/redis";

const mockRedis = redis as {
  exists: ReturnType<typeof vi.fn>;
  hgetall: ReturnType<typeof vi.fn>;
  lrange: ReturnType<typeof vi.fn>;
};

describe("GET /api/stream/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for non-existent session", async () => {
    mockRedis.exists.mockResolvedValue(0);
    const response = await GET(
      new Request("http://localhost:3847/api/stream/NOCODE"),
      { params: Promise.resolve({ code: "NOCODE" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns SSE headers for valid session", async () => {
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.hgetall.mockResolvedValue({ great: "3", okay: "1" });
    mockRedis.lrange.mockResolvedValue([]);

    const response = await GET(
      new Request("http://localhost:3847/api/stream/ABC123"),
      { params: Promise.resolve({ code: "ABC123" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("streams initial data immediately", async () => {
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.hgetall.mockResolvedValue({ great: "5", fired_up: "2" });
    mockRedis.lrange.mockResolvedValue([
      JSON.stringify({ mood: "great", text: "Nice!", ts: 1234567890 }),
    ]);

    const response = await GET(
      new Request("http://localhost:3847/api/stream/TEST01"),
      { params: Promise.resolve({ code: "TEST01" }) },
    );

    const reader = response.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    expect(text).toContain("data:");
    const jsonStr = text.replace("data: ", "").trim();
    const data = JSON.parse(jsonStr);
    expect(data.counts).toEqual({ great: "5", fired_up: "2" });
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].text).toBe("Nice!");

    // Cancel the stream to clean up
    await reader.cancel();
  });

  it("response body is a ReadableStream", async () => {
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.hgetall.mockResolvedValue({});
    mockRedis.lrange.mockResolvedValue([]);

    const response = await GET(
      new Request("http://localhost:3847/api/stream/STREAM"),
      { params: Promise.resolve({ code: "STREAM" }) },
    );

    expect(response.body).toBeInstanceOf(ReadableStream);
    // Clean up
    await response.body!.cancel();
  });
});
