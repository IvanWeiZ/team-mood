"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MOODS, MAX_COMMENT_LENGTH } from "@/lib/constants";

export default function MoodSubmit({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = React.use(params);
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/mood/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selected,
          comment: comment.trim() || undefined,
        }),
      });
      if (res.ok) {
        router.push(`/session/${code}/dashboard`);
      } else {
        setError("Failed to submit");
      }
    } catch {
      setError("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container">
      <div className="header">
        <h1>How are you feeling?</h1>
        <p className="session-code">
          Session: <span className="code-badge">{code}</span>
        </p>
      </div>

      <div className="mood-grid">
        {MOODS.map((m) => (
          <button
            key={m.key}
            className={`mood-btn ${selected === m.key ? "mood-btn-selected" : ""}`}
            onClick={() => setSelected(m.key)}
          >
            <span className="mood-emoji">{m.emoji}</span>
            <span className="mood-label">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="comment-section">
        <textarea
          className="textarea"
          placeholder="Add an optional comment (anonymous)..."
          maxLength={MAX_COMMENT_LENGTH}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        <div className="char-count">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </div>
      </div>

      <button
        className="btn btn-primary btn-submit"
        onClick={submit}
        disabled={!selected || submitting}
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
