import { describe, it, expect, vi, beforeEach } from "vitest";
import { Parsera } from "./parsera.js";
import type { ParseraResponse } from "../types/parsera.js";

describe("Parsera", () => {
  let parsera: Parsera;
  const mockApiKey = "x".repeat(32);

  beforeEach(() => {
    parsera = new Parsera({
      apiKey: mockApiKey,
      timeout: 1000,
    });
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with default options", () => {
      const instance = new Parsera({ apiKey: mockApiKey });
      expect(instance).toBeInstanceOf(Parsera);
    });

    it("should throw error for invalid API key", () => {
      expect(() => new Parsera({ apiKey: "short" })).toThrow(
        "Invalid API key format"
      );
    });
  });

  describe("extract", () => {
    const mockResponse: ParseraResponse = {
      data: [{ title: "Test Title", price: "$99.99" }],
    };

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
    });

    it("should extract data successfully", async () => {
      const result = await parsera.extract({
        url: "https://example.com",
        attributes: {
          title: "Extract the title",
          price: "Get the price",
        },
      });

      expect(result).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/extract"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": mockApiKey,
          },
        })
      );
    });

    it("should handle rate limiting with retries", async () => {
      const rateLimitResponse = {
        ok: false,
        status: 429,
        json: () => Promise.resolve({ message: "Rate limit exceeded" }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await parsera.extract({
        url: "https://example.com",
        attributes: { title: "Extract the title" },
      });

      expect(result).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("should handle request timeout", async () => {
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          const abortError = new Error("The operation was aborted");
          abortError.name = "AbortError";
          setTimeout(() => reject(abortError), 2000);
        });
      });

      global.fetch = mockFetch;
      parsera = new Parsera({
        apiKey: mockApiKey,
        timeout: 100,
      });

      await expect(
        parsera.extract({
          url: "https://example.com",
          attributes: { title: "Extract the title" },
        })
      ).rejects.toThrow("Request timed out");
    }, 5000);

    it("should handle request cancellation", async () => {
      const controller = new AbortController();
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Request aborted"));
          }, 0);
        });
      });

      global.fetch = mockFetch;

      const promise = parsera.extract({
        url: "https://example.com",
        attributes: { title: "Extract the title" },
        signal: controller.signal,
      });

      controller.abort();
      await expect(promise).rejects.toThrow();
    });

    it("should validate URL format", async () => {
      await expect(
        parsera.extract({
          url: "invalid-url",
          attributes: { title: "Extract the title" },
        })
      ).rejects.toThrow("Invalid URL format");
    });

    it("should handle empty response data", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await expect(
        parsera.extract({
          url: "https://example.com",
          attributes: { title: "Extract the title" },
        })
      ).rejects.toThrow("No data returned from Parsera API");
    });
  });

  describe("event handling", () => {
    it("should emit events in correct order", async () => {
      const events: string[] = [];
      const mockResponse: ParseraResponse = {
        data: [{ title: "Test" }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      parsera.on("extract:start", () => {
        events.push("start");
        return Promise.resolve();
      });
      parsera.on("extract:complete", () => {
        events.push("complete");
        return Promise.resolve();
      });

      await parsera.extract({
        url: "https://example.com",
        attributes: { title: "Extract the title" },
      });

      expect(events).toEqual(["start", "complete"]);
    });

    it("should handle async event handlers", async () => {
      const mockResponse: ParseraResponse = {
        data: [{ title: "Test" }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const handler = vi.fn().mockResolvedValue(undefined);
      parsera.on("extract:complete", handler, { async: true });

      await parsera.extract({
        url: "https://example.com",
        attributes: { title: "Extract the title" },
      });

      expect(handler).toHaveBeenCalled();
    });

    it("should remove event listeners", async () => {
      const handler = vi.fn();
      parsera.on("extract:start", handler);
      parsera.off("extract:start", handler);

      await parsera.extract({
        url: "https://example.com",
        attributes: { title: "Extract the title" },
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should remove all event listeners", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      parsera.on("extract:start", handler1);
      parsera.on("extract:complete", handler2);
      parsera.removeAllListeners();

      await parsera.extract({
        url: "https://example.com",
        attributes: { title: "Extract the title" },
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("alias methods", () => {
    it("should have run method as alias for extract", async () => {
      const mockResponse: ParseraResponse = {
        data: [{ title: "Test" }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await parsera.run({
        url: "https://example.com",
        attributes: { title: "Extract the title" },
      });

      expect(result).toEqual(mockResponse.data);
    });

    it("should have arun method as alias for extract", async () => {
      const mockResponse: ParseraResponse = {
        data: [{ title: "Test" }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await parsera.arun({
        url: "https://example.com",
        attributes: { title: "Extract the title" },
      });

      expect(result).toEqual(mockResponse.data);
    });
  });
});
