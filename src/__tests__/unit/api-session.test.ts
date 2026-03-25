vi.mock("@/lib/redis", () => ({
  redis: {
    exists: vi.fn().mockResolvedValue(0),
    set: vi.fn().mockResolvedValue("OK"),
  },
}));

import { POST } from "@/app/api/session/route";
import { redis } from "@/lib/redis";

describe("POST /api/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a response with a 6-character code", async () => {
    const response = await POST();
    const data = await response.json();

    expect(data).toHaveProperty("code");
    expect(typeof data.code).toBe("string");
    expect(data.code).toHaveLength(6);
  });

  it("calls redis.set with session:{code} pattern and TTL", async () => {
    const response = await POST();
    const data = await response.json();

    expect(redis.set).toHaveBeenCalledWith(
      `session:${data.code}`,
      "1",
      "EX",
      86400,
    );
  });

  it("checks redis.exists to avoid code collision", async () => {
    await POST();
    expect(redis.exists).toHaveBeenCalled();
    const call = vi.mocked(redis.exists).mock.calls[0][0];
    expect(call).toMatch(/^session:[A-Z2-9]{6}$/);
  });
});
