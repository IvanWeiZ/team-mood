const mockPipe = {
  hincrby: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  lpush: vi.fn().mockReturnThis(),
  ltrim: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue([]),
};

vi.mock("@/lib/redis", () => ({
  redis: {
    exists: vi.fn(),
    hincrby: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    lpush: vi.fn().mockResolvedValue(1),
    ltrim: vi.fn().mockResolvedValue("OK"),
    hgetall: vi.fn().mockResolvedValue({}),
    lrange: vi.fn().mockResolvedValue([]),
    pipeline: vi.fn(() => ({ ...mockPipe })),
  },
}));

import { POST, GET } from "@/app/api/mood/[code]/route";
import { redis } from "@/lib/redis";

function makeRequest(body: unknown) {
  return new Request("http://localhost:3847/api/mood/ABC123", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validParams = { params: Promise.resolve({ code: "ABC123" }) };

describe("POST /api/mood/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redis.exists).mockResolvedValue(1);
  });

  it("valid mood without comment: calls hincrby and returns success", async () => {
    const pipe = { ...mockPipe };
    vi.mocked(redis.pipeline).mockReturnValue(pipe as never);

    const request = makeRequest({ mood: "great" });
    const response = await POST(request, validParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(redis.pipeline).toHaveBeenCalled();
    expect(pipe.hincrby).toHaveBeenCalledWith("mood:ABC123", "great", 1);
    expect(pipe.expire).toHaveBeenCalledWith("mood:ABC123", 86400);
    expect(pipe.lpush).not.toHaveBeenCalled();
    expect(pipe.exec).toHaveBeenCalled();
  });

  it("valid mood with comment: calls hincrby + lpush + ltrim and returns success", async () => {
    const pipe = { ...mockPipe };
    vi.mocked(redis.pipeline).mockReturnValue(pipe as never);

    const request = makeRequest({ mood: "okay", comment: "Feeling alright" });
    const response = await POST(request, validParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(pipe.hincrby).toHaveBeenCalledWith("mood:ABC123", "okay", 1);
    expect(pipe.lpush).toHaveBeenCalledWith(
      "comments:ABC123",
      expect.stringContaining('"mood":"okay"'),
    );
    expect(pipe.ltrim).toHaveBeenCalledWith("comments:ABC123", 0, 99);
    expect(pipe.exec).toHaveBeenCalled();
  });

  it("invalid mood: returns 400", async () => {
    const request = makeRequest({ mood: "invalid_mood" });
    const response = await POST(request, validParams);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
  });

  it("session not found: returns 404", async () => {
    vi.mocked(redis.exists).mockResolvedValue(0);

    const request = makeRequest({ mood: "great" });
    const response = await POST(request, validParams);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
  });
});

describe("GET /api/mood/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redis.exists).mockResolvedValue(1);
  });

  it("returns counts and comments", async () => {
    vi.mocked(redis.hgetall).mockResolvedValue({ great: "3", okay: "1" });
    vi.mocked(redis.lrange).mockResolvedValue([
      JSON.stringify({ mood: "great", text: "Nice!", ts: 1000 }),
    ]);

    const request = new Request("http://localhost:3847/api/mood/ABC123");
    const response = await GET(request, validParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.counts).toEqual({ great: "3", okay: "1" });
    expect(data.comments).toEqual([{ mood: "great", text: "Nice!", ts: 1000 }]);
  });

  it("session not found returns 404", async () => {
    vi.mocked(redis.exists).mockResolvedValue(0);

    const request = new Request("http://localhost:3847/api/mood/XXXXXX");
    const response = await GET(request, {
      params: Promise.resolve({ code: "XXXXXX" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
  });
});
