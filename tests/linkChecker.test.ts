/**
 * Tests for link checker and scoring system
 */

import { checkUrl, healUrl, shouldTombstone, extractUrlParts } from "@/lib/linkChecker";

// Mock fetch for testing
global.fetch = jest.fn();

describe("Link Checker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkUrl", () => {
    it("should return high score for 200 OK with matching title", async () => {
      const mockResponse = {
        status: 200,
        url: "https://example.com/event",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: false,
        text: jest.fn().mockResolvedValue('<html><title>Tax Conference 2025</title></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/event", ["tax", "conference"]);

      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.status).toBe(200);
      expect(result.title).toBe("tax conference 2025");
      expect(result.needsJs).toBe(false);
    });

    it("should handle redirects correctly", async () => {
      const mockResponse = {
        status: 200,
        url: "https://example.com/final-event",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: true,
        text: jest.fn().mockResolvedValue('<html><title>Final Event Page</title></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/event", ["event"]);

      expect(result.finalUrl).toBe("https://example.com/final-event");
      expect(result.redirectChain).toHaveLength(1);
      expect(result.redirectChain[0]).toBe("https://example.com/final-event");
    });

    it("should return low score for 404", async () => {
      const mockResponse = {
        status: 404,
        url: "https://example.com/not-found",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: false,
        text: jest.fn().mockResolvedValue('<html><title>Not Found</title></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/not-found", ["event"]);

      expect(result.score).toBe(0);
      expect(result.status).toBe(404);
    });

    it("should detect SPA shells", async () => {
      const mockResponse = {
        status: 200,
        url: "https://example.com/spa",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: false,
        text: jest.fn().mockResolvedValue('<html><body><div id="root"></div></body></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/spa", ["event"]);

      expect(result.needsJs).toBe(true);
      expect(result.score).toBeLessThan(50); // Should have penalty for SPA
    });

    it("should extract canonical URLs", async () => {
      const mockResponse = {
        status: 200,
        url: "https://example.com/event",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: false,
        text: jest.fn().mockResolvedValue('<html><head><link rel="canonical" href="https://example.com/canonical-event"></head></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/event", ["event"]);

      expect(result.canonical).toBe("https://example.com/canonical-event");
      expect(result.score).toBeGreaterThanOrEqual(55); // Base score + canonical bonus
    });

    it("should handle fetch errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await checkUrl("https://example.com/error", ["event"]);

      expect(result.score).toBe(0);
      expect(result.status).toBe(0);
      expect(result.error).toBe("Network error");
    });
  });

  describe("healUrl", () => {
    it("should remove problematic query parameters", () => {
      const url = "https://example.com/event?utm_source=google&utm_medium=cpc&utm_campaign=test&fbclid=123&real_param=value";
      const healed = healUrl(url);
      
      expect(healed).toBe("https://example.com/event?real_param=value");
    });

    it("should remove hash fragments", () => {
      const url = "https://example.com/event#section1";
      const healed = healUrl(url);
      
      expect(healed).toBe("https://example.com/event");
    });

    it("should handle malformed URLs", () => {
      const url = "not-a-url";
      const healed = healUrl(url);
      
      expect(healed).toBe("not-a-url"); // Should return original if can't parse
    });
  });

  describe("shouldTombstone", () => {
    it("should tombstone 404 with low score", () => {
      expect(shouldTombstone(404, [], 5)).toBe(true);
    });

    it("should tombstone 410 with low score", () => {
      expect(shouldTombstone(410, [], 8)).toBe(true);
    });

    it("should not tombstone 404 with high score", () => {
      expect(shouldTombstone(404, [], 80)).toBe(false);
    });

    it("should tombstone URLs with too many redirects", () => {
      const manyRedirects = Array(6).fill("https://example.com/redirect");
      expect(shouldTombstone(200, manyRedirects, 50)).toBe(true);
    });

    it("should tombstone server errors with very low scores", () => {
      expect(shouldTombstone(500, [], 3)).toBe(true);
    });

    it("should not tombstone successful requests", () => {
      expect(shouldTombstone(200, [], 70)).toBe(false);
    });
  });

  describe("extractUrlParts", () => {
    it("should extract domain and path correctly", () => {
      const url = "https://example.com/events/tax-conference?param=value";
      const parts = extractUrlParts(url);
      
      expect(parts).toEqual({
        domain: "example.com",
        path: "/events/tax-conference?param=value"
      });
    });

    it("should handle URLs without paths", () => {
      const url = "https://example.com";
      const parts = extractUrlParts(url);
      
      expect(parts).toEqual({
        domain: "example.com",
        path: "/"
      });
    });

    it("should return null for invalid URLs", () => {
      const url = "not-a-url";
      const parts = extractUrlParts(url);
      
      expect(parts).toBeNull();
    });
  });

  describe("scoring algorithm", () => {
    it("should give base score for 200 OK", async () => {
      const mockResponse = {
        status: 200,
        url: "https://example.com/event",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: false,
        text: jest.fn().mockResolvedValue('<html><title>Event</title></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/event", []);

      expect(result.score).toBeGreaterThanOrEqual(40); // Base score for 200
    });

    it("should give bonus for keyword matches in title", async () => {
      const mockResponse = {
        status: 200,
        url: "https://example.com/event",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: false,
        text: jest.fn().mockResolvedValue('<html><title>Tax Accounting Conference 2025</title></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/event", ["tax", "accounting"]);

      expect(result.score).toBeGreaterThanOrEqual(70); // Base + keyword bonus
    });

    it("should give bonus for canonical URL", async () => {
      const mockResponse = {
        status: 200,
        url: "https://example.com/event",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: false,
        text: jest.fn().mockResolvedValue('<html><head><link rel="canonical" href="https://example.com/canonical"></head></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/event", []);

      expect(result.score).toBeGreaterThanOrEqual(55); // Base + canonical bonus
    });

    it("should penalize too many redirects", async () => {
      const mockResponse = {
        status: 200,
        url: "https://example.com/final",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: true,
        text: jest.fn().mockResolvedValue('<html><title>Final</title></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/start", []);

      expect(result.redirectChain).toHaveLength(1);
      expect(result.score).toBeLessThan(40); // Base score minus redirect penalty
    });

    it("should clamp score between 0 and 100", async () => {
      // Test with a perfect scenario
      const mockResponse = {
        status: 200,
        url: "https://example.com/event",
        headers: new Headers({ "content-type": "text/html" }),
        redirected: false,
        text: jest.fn().mockResolvedValue('<html><title>Perfect Tax Event</title><head><link rel="canonical" href="https://example.com/canonical"></head></html>')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkUrl("https://example.com/event", ["perfect", "tax", "event"]);

      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});
