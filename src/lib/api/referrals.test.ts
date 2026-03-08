import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchReferrals, fetchReferralStats, markReferralFraud } from "./admin";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("admin referrals API", () => {
  it("fetchReferrals calls GET /api/admin/referrals with params", async () => {
    const response = {
      items: [
        {
          id: "ref1",
          referrer_email: "a@test.com",
          referee_email: "b@test.com",
          status: "completed",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    });

    const result = await fetchReferrals({ page: 1, page_size: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/admin/referrals");
  });

  it("fetchReferralStats returns stats", async () => {
    const stats = {
      total: 10,
      completed: 8,
      fraud: 2,
      total_referrer_reward_days: 240,
      total_referee_reward_days: 240,
      top_referrers: [{ email: "top@test.com", name: "Top", count: 5 }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(stats),
    });

    const result = await fetchReferralStats();
    expect(result.total).toBe(10);
    expect(result.completed).toBe(8);
    expect(result.top_referrers).toHaveLength(1);
  });

  it("markReferralFraud calls PUT with correct ID", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: "ok", message: "Referral marked as fraud" }),
    });

    await markReferralFraud("abc123");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/admin/referrals/abc123/mark-fraud");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("PUT");
  });
});
