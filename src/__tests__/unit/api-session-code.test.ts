vi.mock("@/lib/redis", () => ({
  redis: {
    exists: vi.fn(),
  },
}));

import { GET } from "@/app/api/session/[code]/route";
import { redis } from "@/lib/redis";

describe("GET /api/session/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { code, active: true } with 200 when session exists", async () => {
    vi.mocked(redis.exists).mockResolvedValue(1);

    const request = new Request("http://localhost:3847/api/session/ABC123");
    const response = await GET(request, {
      params: Promise.resolve({ code: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ code: "ABC123", active: true });
  });

  it("returns { error } with 404 when session does not exist", async () => {
    vi.mocked(redis.exists).mockResolvedValue(0);

    const request = new Request("http://localhost:3847/api/session/XXXXXX");
    const response = await GET(request, {
      params: Promise.resolve({ code: "XXXXXX" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
  });
});
