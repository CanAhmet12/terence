import { describe, it, expect } from "vitest";
import { normalizeExamSessionFromApi } from "@/lib/api";

describe("normalizeExamSessionFromApi", () => {
  it("unwraps Laravel result wrapper", () => {
    const session = { id: 42, status: "completed", net_score: 75.5 };
    expect(normalizeExamSessionFromApi({ success: true, result: session })).toEqual(session);
  });

  it("maps flat finish payload with session_id", () => {
    const out = normalizeExamSessionFromApi({
      success: true,
      session_id: 9,
      net_score: 12,
      correct_count: 10,
      wrong_count: 2,
      empty_count: 0,
      time_spent_seconds: 3600,
    });
    expect(out.id).toBe(9);
    expect(out.net_score).toBe(12);
    expect(out.status).toBe("completed");
  });
});
