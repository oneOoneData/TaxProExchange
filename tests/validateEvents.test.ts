/**
 * Integration tests for event validation worker
 */

import { validateEventById } from "@/lib/validateEvents";

// Mock the Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }))
}));

// Mock the link checker
jest.mock("@/lib/linkChecker", () => ({
  checkUrl: jest.fn()
}));

import { createServerClient } from "@/lib/supabase/server";
import { checkUrl } from "@/lib/linkChecker";

describe("Event Validation Worker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateEventById", () => {
    it("should validate an event successfully", async () => {
      const mockEvent = {
        id: "test-event-id",
        title: "Tax Conference 2025",
        organizer: "Tax Professionals Association",
        candidate_url: "https://example.com/tax-conference",
        canonical_url: null
      };

      const mockCheckResult = {
        finalUrl: "https://example.com/tax-conference",
        status: 200,
        redirectChain: [],
        score: 85,
        needsJs: false,
        canonical: "https://example.com/tax-conference",
        title: "tax conference 2025"
      };

      // Mock Supabase responses
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockEvent,
                error: null
              }))
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: {},
              error: null
            }))
          }))
        }))
      };

      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
      (checkUrl as jest.Mock).mockResolvedValue(mockCheckResult);

      const result = await validateEventById("test-event-id");

      expect(result.success).toBe(true);
      expect(result.score).toBe(85);
      expect(result.publishable).toBe(true);
      expect(checkUrl).toHaveBeenCalledWith(
        "https://example.com/tax-conference",
        ["tax", "conference", "professionals", "association"]
      );
    });

    it("should handle event not found", async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { code: "PGRST116", message: "No rows returned" }
              }))
            }))
          }))
        }))
      };

      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const result = await validateEventById("nonexistent-event");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Event not found");
    });

    it("should handle event without URL", async () => {
      const mockEvent = {
        id: "test-event-id",
        title: "Tax Conference 2025",
        organizer: "Tax Professionals Association",
        candidate_url: null,
        canonical_url: null
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockEvent,
                error: null
              }))
            }))
          }))
        }))
      };

      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const result = await validateEventById("test-event-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Event has no URL to validate");
    });

    it("should mark event as not publishable when score is too low", async () => {
      const mockEvent = {
        id: "test-event-id",
        title: "Tax Conference 2025",
        organizer: "Tax Professionals Association",
        candidate_url: "https://example.com/broken-link",
        canonical_url: null
      };

      const mockCheckResult = {
        finalUrl: "https://example.com/broken-link",
        status: 404,
        redirectChain: [],
        score: 30,
        needsJs: false,
        canonical: null,
        title: "not found"
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockEvent,
                error: null
              }))
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: {},
              error: null
            }))
          }))
        }))
      };

      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
      (checkUrl as jest.Mock).mockResolvedValue(mockCheckResult);

      const result = await validateEventById("test-event-id");

      expect(result.success).toBe(true);
      expect(result.score).toBe(30);
      expect(result.publishable).toBe(false);
    });

    it("should handle database update errors", async () => {
      const mockEvent = {
        id: "test-event-id",
        title: "Tax Conference 2025",
        organizer: "Tax Professionals Association",
        candidate_url: "https://example.com/tax-conference",
        canonical_url: null
      };

      const mockCheckResult = {
        finalUrl: "https://example.com/tax-conference",
        status: 200,
        redirectChain: [],
        score: 85,
        needsJs: false,
        canonical: "https://example.com/tax-conference",
        title: "tax conference 2025"
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockEvent,
                error: null
              }))
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: null,
              error: { message: "Database error" }
            }))
          }))
        }))
      };

      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
      (checkUrl as jest.Mock).mockResolvedValue(mockCheckResult);

      const result = await validateEventById("test-event-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });
});
