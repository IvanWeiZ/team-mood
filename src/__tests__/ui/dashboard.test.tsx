import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "@/app/session/[code]/dashboard/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Spy on React.use to handle promise params synchronously
vi.spyOn(React, "use").mockImplementation((usable: any) => {
  if (usable && typeof usable === "object" && "then" in usable) {
    return usable._resolvedValue;
  }
  return usable;
});

type OnMessageHandler = ((event: MessageEvent) => void) | null;
type OnErrorHandler = (() => void) | null;

let mockEventSourceInstance: {
  onmessage: OnMessageHandler;
  onerror: OnErrorHandler;
  close: ReturnType<typeof vi.fn>;
  url: string;
};

class MockEventSource {
  onmessage: OnMessageHandler = null;
  onerror: OnErrorHandler = null;
  close = vi.fn();
  url: string;

  constructor(url: string) {
    this.url = url;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockEventSourceInstance = this;

    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(
          new MessageEvent("message", {
            data: JSON.stringify({
              counts: {
                great: "5",
                okay: "3",
                concerned: "1",
                fired_up: "2",
              },
              comments: [
                { mood: "great", text: "Awesome!", ts: Date.now() },
                { mood: "okay", text: "Could be better", ts: Date.now() },
              ],
            }),
          }),
        );
      }
    }, 0);
  }
}

vi.stubGlobal("EventSource", MockEventSource);

function createParams(code: string) {
  const p = Promise.resolve({ code }) as any;
  p._resolvedValue = { code };
  return p;
}

function renderPage(code = "ABC123") {
  return render(<Dashboard params={createParams(code)} />);
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // Re-setup the React.use spy
  vi.spyOn(React, "use").mockImplementation((usable: any) => {
    if (usable && typeof usable === "object" && "then" in usable) {
      return usable._resolvedValue;
    }
    return usable;
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Dashboard Page", () => {
  it('renders "Live Results" heading', () => {
    renderPage();
    expect(screen.getByText("Live Results")).toBeInTheDocument();
  });

  it("renders session code", () => {
    renderPage();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it('shows "Copy Join Link" button', () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: "Copy Join Link" }),
    ).toBeInTheDocument();
  });

  it("after SSE data arrives: shows mood bars with correct counts", async () => {
    renderPage();

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("shows response count (11 responses)", async () => {
    renderPage();

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(screen.getByText("11 responses")).toBeInTheDocument();
    });
  });

  it("shows comments in feed", async () => {
    renderPage();

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(screen.getByText("Awesome!")).toBeInTheDocument();
      expect(screen.getByText("Could be better")).toBeInTheDocument();
    });
  });

  it("comment cards show emoji + text + time", async () => {
    renderPage();

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(screen.getByText("Awesome!")).toBeInTheDocument();
    });

    const commentCards = document.querySelectorAll(".comment-card");
    expect(commentCards.length).toBe(2);

    // First comment: great emoji
    const firstCard = commentCards[0];
    expect(firstCard.querySelector(".comment-mood")?.textContent).toBe(
      "\u{1F600}",
    );
    expect(firstCard.querySelector(".comment-text")?.textContent).toBe(
      "Awesome!",
    );
    expect(firstCard.querySelector(".comment-time")?.textContent).toBeTruthy();

    // Second comment: okay emoji
    const secondCard = commentCards[1];
    expect(secondCard.querySelector(".comment-mood")?.textContent).toBe(
      "\u{1F610}",
    );
    expect(secondCard.querySelector(".comment-text")?.textContent).toBe(
      "Could be better",
    );
  });

  it("copy link button: calls navigator.clipboard.writeText with correct URL", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    renderPage();

    const btn = screen.getByRole("button", { name: "Copy Join Link" });
    await user.click(btn);

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/session/ABC123`,
    );
  });
});
