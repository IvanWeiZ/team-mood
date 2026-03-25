"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const createSession = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/session", { method: "POST" });
      const data = await res.json();
      if (data.code) {
        router.push(`/session/${data.code}/dashboard`);
      }
    } catch {
      setError("Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const joinSession = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/session/${code}`);
      if (res.ok) {
        router.push(`/session/${code}`);
      } else {
        setError("Session not found");
      }
    } catch {
      setError("Failed to join session");
    } finally {
      setJoining(false);
    }
  };

  return (
    <main className="container">
      <div className="hero">
        <h1 className="title">Team Mood</h1>
        <p className="subtitle">Anonymous real-time team feedback</p>
      </div>

      <div className="card-group">
        <div className="card">
          <h2>Start a Session</h2>
          <p className="card-desc">Create a new mood check-in for your team</p>
          <button
            className="btn btn-primary"
            onClick={createSession}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Session"}
          </button>
        </div>

        <div className="divider">or</div>

        <div className="card">
          <h2>Join a Session</h2>
          <p className="card-desc">
            Enter the 6-character code from your facilitator
          </p>
          <div className="input-group">
            <input
              type="text"
              className="input"
              placeholder="Enter code"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinSession()}
            />
            <button
              className="btn btn-secondary"
              onClick={joinSession}
              disabled={joining}
            >
              {joining ? "Joining..." : "Join"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
