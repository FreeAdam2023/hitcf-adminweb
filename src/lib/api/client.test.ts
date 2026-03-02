import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get, post, put, del, ApiError } from "./client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const locationMock = { href: "" };
Object.defineProperty(window, "location", {
  value: locationMock,
  writable: true,
});

beforeEach(() => {
  mockFetch.mockReset();
  locationMock.href = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Admin API client - get", () => {
  it("should make a GET request and return JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ user_count: 42 }),
    });

    const result = await get<{ user_count: number }>("/api/admin/stats");
    expect(result).toEqual({ user_count: 42 });
  });

  it("should handle 204 No Content", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    const result = await get("/api/admin/action");
    expect(result).toBeUndefined();
  });
});

describe("Admin API client - post", () => {
  it("should send JSON body with POST", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });

    await post("/api/admin/users/update", { role: "admin" });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ role: "admin" }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });
});

describe("Admin API client - put", () => {
  it("should send PUT request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ updated: true }),
    });

    await put("/api/admin/questions/1", { correct_answer: "B" });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("PUT");
  });
});

describe("Admin API client - del", () => {
  it("should send DELETE request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ deleted: true }),
    });

    await del("/api/admin/questions/1");
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("DELETE");
  });
});

describe("Admin API client - error handling", () => {
  it("should redirect to /login on 401", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(get("/api/admin/stats")).rejects.toThrow(ApiError);
    expect(locationMock.href).toBe("/login");
  });

  it("should throw ApiError on 403", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: () => Promise.resolve({ detail: "Admin access required" }),
    });

    try {
      await get("/api/admin/stats");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(403);
    }
  });

  it("should throw ApiError on 500 with fallback message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("not json")),
    });

    try {
      await get("/api/admin/broken");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).message).toBe("Internal Server Error");
    }
  });
});
