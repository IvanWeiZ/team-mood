export const MOODS = [
  { key: "great", emoji: "😀", label: "Great" },
  { key: "okay", emoji: "😐", label: "Okay" },
  { key: "concerned", emoji: "😟", label: "Concerned" },
  { key: "fired_up", emoji: "🔥", label: "Fired Up" },
] as const;

export const SESSION_TTL = 86400; // 24 hours
export const CODE_LENGTH = 6;
export const MAX_COMMENT_LENGTH = 280;

export const KEY = {
  session: (code: string) => `session:${code}`,
  mood: (code: string) => `mood:${code}`,
  comments: (code: string) => `comments:${code}`,
} as const;
