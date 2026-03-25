import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Landing Page", () => {
  it('renders "Team Mood" title', () => {
    render(<Home />);
    expect(screen.getByText("Team Mood")).toBeInTheDocument();
  });

  it('renders "Create Session" button', () => {
    render(<Home />);
    expect(
      screen.getByRole("button", { name: "Create Session" }),
    ).toBeInTheDocument();
  });

  it("renders join code input", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("Enter code")).toBeInTheDocument();
  });

  it('renders "Join" button', () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
  });

  it("input maxLength is 6", () => {
    render(<Home />);
    const input = screen.getByPlaceholderText("Enter code");
    expect(input).toHaveAttribute("maxLength", "6");
  });

  it("create session: calls fetch POST and navigates to dashboard", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ code: "ABC123" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Create Session" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/session", {
        method: "POST",
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/session/ABC123/dashboard");
    });
  });

  it("join session: uppercases input, validates session, navigates", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<Home />);
    const input = screen.getByPlaceholderText("Enter code");

    await user.type(input, "abc123");
    expect(input).toHaveValue("ABC123");

    await user.click(screen.getByRole("button", { name: "Join" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/session/ABC123");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/session/ABC123");
    });
  });

  it("join with invalid code: shows error when session not found", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<Home />);
    const input = screen.getByPlaceholderText("Enter code");

    await user.type(input, "BADCOD");
    await user.click(screen.getByRole("button", { name: "Join" }));

    await waitFor(() => {
      expect(screen.getByText("Session not found")).toBeInTheDocument();
    });
  });
});
