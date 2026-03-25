import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MoodSubmit from "@/app/session/[code]/page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Spy on React.use to handle promise params synchronously
vi.spyOn(React, "use").mockImplementation((usable: any) => {
  if (usable && typeof usable === "object" && "then" in usable) {
    return usable._resolvedValue;
  }
  return usable;
});

function createParams(code: string) {
  const p = Promise.resolve({ code }) as any;
  p._resolvedValue = { code };
  return p;
}

function renderPage(code = "ABC123") {
  return render(<MoodSubmit params={createParams(code)} />);
}

beforeEach(() => {
  vi.resetAllMocks();
  // Re-setup the React.use spy after resetAllMocks
  vi.spyOn(React, "use").mockImplementation((usable: any) => {
    if (usable && typeof usable === "object" && "then" in usable) {
      return usable._resolvedValue;
    }
    return usable;
  });
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Mood Submit Page", () => {
  it('renders "How are you feeling?" heading', () => {
    renderPage();
    expect(screen.getByText("How are you feeling?")).toBeInTheDocument();
  });

  it("renders session code badge", () => {
    renderPage();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("renders all 4 mood emoji buttons", () => {
    renderPage();
    for (const emoji of ["\u{1F600}", "\u{1F610}", "\u{1F61F}", "\u{1F525}"]) {
      expect(screen.getByText(emoji)).toBeInTheDocument();
    }
  });

  it("clicking a mood button selects it (adds mood-btn-selected class)", async () => {
    const user = userEvent.setup();
    renderPage();

    const greatBtn = screen.getByText("\u{1F600}").closest("button")!;
    await user.click(greatBtn);

    expect(greatBtn).toHaveClass("mood-btn-selected");
  });

  it("renders comment textarea with placeholder", () => {
    renderPage();
    expect(
      screen.getByPlaceholderText("Add an optional comment (anonymous)..."),
    ).toBeInTheDocument();
  });

  it("textarea has maxLength 280", () => {
    renderPage();
    const textarea = screen.getByPlaceholderText(
      "Add an optional comment (anonymous)...",
    );
    expect(textarea).toHaveAttribute("maxLength", "280");
  });

  it('character count shows "0/280" initially', () => {
    renderPage();
    expect(screen.getByText("0/280")).toBeInTheDocument();
  });

  it("typing in textarea updates character count", async () => {
    const user = userEvent.setup();
    renderPage();

    const textarea = screen.getByPlaceholderText(
      "Add an optional comment (anonymous)...",
    );
    await user.type(textarea, "Hello");

    expect(screen.getByText("5/280")).toBeInTheDocument();
  });

  it("submit button is disabled when no mood selected", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: "Submit Feedback" }),
    ).toBeDisabled();
  });

  it("submit button is enabled after selecting a mood", async () => {
    const user = userEvent.setup();
    renderPage();

    const greatBtn = screen.getByText("\u{1F600}").closest("button")!;
    await user.click(greatBtn);

    expect(
      screen.getByRole("button", { name: "Submit Feedback" }),
    ).toBeEnabled();
  });

  it("successful submit: calls fetch POST and redirects to dashboard", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    renderPage();

    const greatBtn = screen.getByText("\u{1F600}").closest("button")!;
    await user.click(greatBtn);

    const textarea = screen.getByPlaceholderText(
      "Add an optional comment (anonymous)...",
    );
    await user.type(textarea, "Feeling good");

    await user.click(screen.getByRole("button", { name: "Submit Feedback" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/mood/ABC123", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: "great", comment: "Feeling good" }),
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/session/ABC123/dashboard");
    });
  });
});
