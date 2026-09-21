import { describe, expect, it } from "vitest";
import {
  loadReviewState,
  markReviewed,
  parseReviewState,
  reviewAgeDays,
  saveReviewState,
  toggleReviewPattern
} from "../src/core/review";

describe("review persistence", () => {
  it("drops malformed entries and invalid timestamps", () => {
    const parsed=parseReviewState({
      good:{addedAt:"2026-09-20T10:00:00.000Z",lastReviewed:"2026-09-21T10:00:00.000Z"},
      badDate:{addedAt:"not-a-date"},
      emptyId:{addedAt:"2026-09-20T10:00:00.000Z"},
      primitive:"wrong"
    });

    expect(parsed.good).toEqual({
      patternId:"good",
      addedAt:"2026-09-20T10:00:00.000Z",
      lastReviewed:"2026-09-21T10:00:00.000Z"
    });
    expect(parsed.badDate).toBeUndefined();
    expect(parsed.primitive).toBeUndefined();
  });

  it("recovers from unreadable or throwing storage", () => {
    const invalid={getItem:()=>"{not json"};
    const throwing={getItem:()=>{throw new Error("blocked");}};
    expect(loadReviewState(invalid)).toEqual({});
    expect(loadReviewState(throwing)).toEqual({});
  });

  it("reports storage write failure without throwing", () => {
    const storage={setItem:()=>{throw new Error("quota");}};
    expect(saveReviewState({},storage)).toBe(false);
  });
});

describe("review mutations", () => {
  it("adds and removes patterns immutably", () => {
    const added=toggleReviewPattern({},"sql-latest","2026-09-20T10:00:00.000Z");
    expect(added["sql-latest"]?.addedAt).toBe("2026-09-20T10:00:00.000Z");

    const removed=toggleReviewPattern(added,"sql-latest","2026-09-21T10:00:00.000Z");
    expect(removed["sql-latest"]).toBeUndefined();
    expect(added["sql-latest"]).toBeDefined();
  });

  it("rejects blank IDs and invalid timestamps", () => {
    const state={};
    expect(toggleReviewPattern(state,"   ","2026-09-20T10:00:00.000Z")).toBe(state);
    expect(toggleReviewPattern(state,"sql-latest","not-a-date")).toBe(state);
  });

  it("marks an existing pattern reviewed without changing addedAt", () => {
    const state=toggleReviewPattern({},"sql-latest","2026-09-19T10:00:00.000Z");
    const reviewed=markReviewed(state,"sql-latest","2026-09-21T10:00:00.000Z");
    expect(reviewed["sql-latest"]).toEqual({
      patternId:"sql-latest",
      addedAt:"2026-09-19T10:00:00.000Z",
      lastReviewed:"2026-09-21T10:00:00.000Z"
    });
  });
});

describe("reviewAgeDays", () => {
  it("prioritizes never-reviewed or malformed review dates", () => {
    expect(reviewAgeDays({patternId:"a",addedAt:"2026-09-20T00:00:00.000Z"}))
      .toBe(Number.POSITIVE_INFINITY);
    expect(reviewAgeDays({
      patternId:"a",
      addedAt:"2026-09-20T00:00:00.000Z",
      lastReviewed:"bad"
    })).toBe(Number.POSITIVE_INFINITY);
  });

  it("calculates whole-day age and clamps future timestamps to zero", () => {
    const now=Date.parse("2026-09-21T12:00:00.000Z");
    expect(reviewAgeDays({
      patternId:"a",
      addedAt:"2026-09-18T00:00:00.000Z",
      lastReviewed:"2026-09-19T11:59:59.000Z"
    },now)).toBe(2);
    expect(reviewAgeDays({
      patternId:"a",
      addedAt:"2026-09-21T00:00:00.000Z",
      lastReviewed:"2026-09-22T00:00:00.000Z"
    },now)).toBe(0);
  });
});
