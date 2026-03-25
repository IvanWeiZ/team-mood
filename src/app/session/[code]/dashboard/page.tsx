"use client";

import React, { useState, useEffect, useRef } from "react";
import { MOODS } from "@/lib/constants";

interface MoodData {
  counts: Record<string, string>;
  comments: Array<{ mood: string; text: string; ts: number }>;
}

export default function Dashboard({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = React.use(params);
  const [data, setData] = useState<MoodData | null>(null);
  const [connected, setConnected] = useState(false);
  const [shareTooltip, setShareTooltip] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Try SSE first
    const es = new EventSource(`/api/stream/${code}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
        setConnected(true);
      } catch {
        /* ignore parse errors */
      }
    };

    es.onerror = () => {
      es.close();
      setConnected(false);
      // Fall back to polling
      if (!pollingRef.current) {
        const poll = async () => {
          try {
            const res = await fetch(`/api/mood/${code}`);
            if (res.ok) {
              const json = await res.json();
              setData(json);
            }
          } catch {
            /* ignore */
          }
        };
        poll();
        pollingRef.current = setInterval(poll, 3000);
      }
    };

    return () => {
      es.close();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [code]);

  const totalVotes = data
    ? Object.values(data.counts).reduce((sum, v) => sum + parseInt(v || "0"), 0)
    : 0;

  const copyLink = () => {
    const url = `${window.location.origin}/session/${code}`;
    navigator.clipboard.writeText(url);
    setShareTooltip(true);
    setTimeout(() => setShareTooltip(false), 2000);
  };

  const moodEmoji = (key: string) =>
    MOODS.find((m) => m.key === key)?.emoji || key;

  return (
    <main className="container dashboard">
      <div className="header">
        <h1>Live Results</h1>
        <div className="header-meta">
          <p className="session-code">
            Session: <span className="code-badge">{code}</span>
          </p>
          <span
            className={`status-dot ${connected ? "status-live" : "status-polling"}`}
          />
          <span className="status-text">{connected ? "Live" : "Polling"}</span>
        </div>
      </div>

      <div className="share-bar">
        <button className="btn btn-secondary btn-sm" onClick={copyLink}>
          {shareTooltip ? "Copied!" : "Copy Join Link"}
        </button>
        <span className="vote-count">
          {totalVotes} response{totalVotes !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="chart-section">
        <h2>Mood Distribution</h2>
        <div className="bar-chart">
          {MOODS.map((m) => {
            const count = parseInt(data?.counts[m.key] || "0");
            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            return (
              <div key={m.key} className="bar-row">
                <span className="bar-emoji">{m.emoji}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${pct}%` }}
                    data-mood={m.key}
                  />
                </div>
                <span className="bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {data && data.comments.length > 0 && (
        <div className="comments-section">
          <h2>Anonymous Comments</h2>
          <div className="comment-feed">
            {data.comments.map((c, i) => (
              <div key={`${c.ts}-${i}`} className="comment-card">
                <span className="comment-mood">{moodEmoji(c.mood)}</span>
                <p className="comment-text">{c.text}</p>
                <span className="comment-time">
                  {new Date(c.ts).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
