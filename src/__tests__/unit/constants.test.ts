import {
  MOODS,
  SESSION_TTL,
  CODE_LENGTH,
  MAX_COMMENT_LENGTH,
} from "@/lib/constants";

describe("constants", () => {
  describe("MOODS", () => {
    it("has exactly 4 entries", () => {
      expect(MOODS).toHaveLength(4);
    });

    it("each mood has key, emoji, and label properties", () => {
      for (const mood of MOODS) {
        expect(mood).toHaveProperty("key");
        expect(mood).toHaveProperty("emoji");
        expect(mood).toHaveProperty("label");
      }
    });

    it("mood keys are great, okay, concerned, fired_up", () => {
      const keys = MOODS.map((m) => m.key);
      expect(keys).toEqual(["great", "okay", "concerned", "fired_up"]);
    });
  });

  it("SESSION_TTL is 86400", () => {
    expect(SESSION_TTL).toBe(86400);
  });

  it("CODE_LENGTH is 6", () => {
    expect(CODE_LENGTH).toBe(6);
  });

  it("MAX_COMMENT_LENGTH is 280", () => {
    expect(MAX_COMMENT_LENGTH).toBe(280);
  });
});
