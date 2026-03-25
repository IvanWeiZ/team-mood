import { test, expect } from "@playwright/test";

test.describe("Team Mood App", () => {
  test.describe("Landing Page", () => {
    test("shows app title and both actions", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "Team Mood" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Create Session" }),
      ).toBeVisible();
      await expect(page.getByPlaceholder("Enter code")).toBeVisible();
      await expect(page.getByRole("button", { name: "Join" })).toBeVisible();
    });

    test("shows error for invalid session code", async ({ page }) => {
      await page.goto("/");
      await page.getByPlaceholder("Enter code").fill("ZZZZZ1");
      await page.getByRole("button", { name: "Join" }).click();
      await expect(page.getByText("Session not found")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Full Flow: Create → Submit → Dashboard", () => {
    let sessionCode: string;

    test("create a new session and land on dashboard", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Create Session" }).click();

      // Should navigate to dashboard
      await page.waitForURL(/\/session\/[A-Z0-9]{6}\/dashboard/, {
        timeout: 10000,
      });

      // Extract session code from URL
      const url = page.url();
      sessionCode = url.match(/\/session\/([A-Z0-9]{6})\/dashboard/)![1];

      await expect(
        page.getByRole("heading", { name: "Live Results" }),
      ).toBeVisible();
      await expect(page.getByText(sessionCode)).toBeVisible();
      await expect(page.getByText("0 responses")).toBeVisible();
    });

    test("submit mood and see it on dashboard", async ({ page, context }) => {
      // First create a session
      await page.goto("/");
      await page.getByRole("button", { name: "Create Session" }).click();
      await page.waitForURL(/\/session\/[A-Z0-9]{6}\/dashboard/, {
        timeout: 10000,
      });

      const url = page.url();
      const code = url.match(/\/session\/([A-Z0-9]{6})\/dashboard/)![1];

      // Open submit page in new tab
      const submitPage = await context.newPage();
      await submitPage.goto(`/session/${code}`);

      // Verify mood submit page
      await expect(
        submitPage.getByRole("heading", { name: "How are you feeling?" }),
      ).toBeVisible();
      await expect(submitPage.getByText(code)).toBeVisible();

      // Select "Great" mood
      await submitPage.locator(".mood-btn").first().click();

      // Verify it's selected
      await expect(submitPage.locator(".mood-btn-selected")).toHaveCount(1);

      // Add a comment
      await submitPage
        .getByPlaceholder(/comment/i)
        .fill("Feeling great today!");

      // Submit
      await submitPage.getByRole("button", { name: "Submit Feedback" }).click();

      // Should redirect to dashboard
      await submitPage.waitForURL(/\/dashboard/, { timeout: 10000 });

      // Back on original dashboard page, wait for SSE update
      // The dashboard should show 1 response after SSE update
      await expect(page.getByText("1 response")).toBeVisible({
        timeout: 10000,
      });

      // Should show the comment
      await expect(page.getByText("Feeling great today!")).toBeVisible({
        timeout: 10000,
      });

      await submitPage.close();
    });
  });

  test.describe("Join Flow", () => {
    test("join existing session by code", async ({ page }) => {
      // Create session via API
      const response = await page.request.post("/api/session");
      const { code } = await response.json();

      // Join via landing page
      await page.goto("/");
      await page.getByPlaceholder("Enter code").fill(code);
      await page.getByRole("button", { name: "Join" }).click();

      // Should navigate to mood submit page
      await page.waitForURL(`/session/${code}`, { timeout: 10000 });
      await expect(
        page.getByRole("heading", { name: "How are you feeling?" }),
      ).toBeVisible();
    });

    test("code input auto-uppercases", async ({ page }) => {
      await page.goto("/");
      await page.getByPlaceholder("Enter code").fill("abcdef");
      await expect(page.getByPlaceholder("Enter code")).toHaveValue("ABCDEF");
    });
  });

  test.describe("Mood Submit Page", () => {
    test("submit button disabled until mood selected", async ({ page }) => {
      const response = await page.request.post("/api/session");
      const { code } = await response.json();

      await page.goto(`/session/${code}`);

      // Submit button should be disabled
      await expect(
        page.getByRole("button", { name: "Submit Feedback" }),
      ).toBeDisabled();

      // Select a mood
      await page.locator(".mood-btn").nth(1).click();

      // Submit button should now be enabled
      await expect(
        page.getByRole("button", { name: "Submit Feedback" }),
      ).toBeEnabled();
    });

    test("character count updates as user types", async ({ page }) => {
      const response = await page.request.post("/api/session");
      const { code } = await response.json();

      await page.goto(`/session/${code}`);
      await expect(page.getByText("0/280")).toBeVisible();

      await page.getByPlaceholder(/comment/i).fill("Hello");
      await expect(page.getByText("5/280")).toBeVisible();
    });

    test("can submit all four mood types", async ({ page }) => {
      const response = await page.request.post("/api/session");
      const { code } = await response.json();

      // Submit each mood type
      const moods = ["great", "okay", "concerned", "fired_up"];
      for (let i = 0; i < 4; i++) {
        await page.goto(`/session/${code}`);
        await page.locator(".mood-btn").nth(i).click();
        await page.getByRole("button", { name: "Submit Feedback" }).click();
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      }

      // Verify all moods counted via API
      const moodResponse = await page.request.get(`/api/mood/${code}`);
      const data = await moodResponse.json();
      for (const mood of moods) {
        expect(parseInt(data.counts[mood] || "0")).toBeGreaterThanOrEqual(1);
      }
    });
  });

  test.describe("Dashboard", () => {
    test("shows copy link button and copies URL", async ({ page, context }) => {
      // Grant clipboard permission
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      const response = await page.request.post("/api/session");
      const { code } = await response.json();

      await page.goto(`/session/${code}/dashboard`);

      await page.getByRole("button", { name: "Copy Join Link" }).click();
      await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
    });

    test("displays real-time updates via SSE", async ({ page }) => {
      const response = await page.request.post("/api/session");
      const { code } = await response.json();

      await page.goto(`/session/${code}/dashboard`);
      await expect(page.getByText("0 responses")).toBeVisible();

      // Submit a mood via API
      await page.request.post(`/api/mood/${code}`, {
        data: { mood: "great", comment: "SSE test!" },
      });

      // Dashboard should update via SSE within a few seconds
      await expect(page.getByText("1 response")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("SSE test!")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("API Endpoints", () => {
    test("POST /api/session creates a session with 6-char code", async ({
      request,
    }) => {
      const response = await request.post("/api/session");
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.code).toMatch(/^[A-Z0-9]{6}$/);
    });

    test("GET /api/session/[code] validates existing session", async ({
      request,
    }) => {
      const createRes = await request.post("/api/session");
      const { code } = await createRes.json();

      const res = await request.get(`/api/session/${code}`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.active).toBe(true);
    });

    test("GET /api/session/[code] returns 404 for invalid session", async ({
      request,
    }) => {
      const res = await request.get("/api/session/ZZZZZZ");
      expect(res.status()).toBe(404);
    });

    test("POST /api/mood/[code] submits mood", async ({ request }) => {
      const createRes = await request.post("/api/session");
      const { code } = await createRes.json();

      const res = await request.post(`/api/mood/${code}`, {
        data: { mood: "great", comment: "Test comment" },
      });
      expect(res.ok()).toBeTruthy();

      const getRes = await request.get(`/api/mood/${code}`);
      const data = await getRes.json();
      expect(parseInt(data.counts.great)).toBe(1);
      expect(data.comments[0].text).toBe("Test comment");
    });

    test("POST /api/mood/[code] rejects invalid mood", async ({ request }) => {
      const createRes = await request.post("/api/session");
      const { code } = await createRes.json();

      const res = await request.post(`/api/mood/${code}`, {
        data: { mood: "invalid_mood" },
      });
      expect(res.status()).toBe(400);
    });
  });
});
