const mockRedisInstance = { get: () => {}, set: () => {} };

vi.mock("ioredis", () => {
  return {
    default: function MockRedis() {
      return mockRedisInstance;
    },
  };
});

describe("redis", () => {
  it("exports a redis object", async () => {
    const { redis } = await import("@/lib/redis");
    expect(redis).toBeDefined();
    expect(typeof redis).toBe("object");
  });

  it("creates a singleton (same reference on multiple imports)", async () => {
    const mod1 = await import("@/lib/redis");
    const mod2 = await import("@/lib/redis");
    expect(mod1.redis).toBe(mod2.redis);
  });
});
