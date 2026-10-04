import { describe, expect, it } from "vitest";
import { countLabel, emptyQuery, isEmptyQuery, toggleTag } from "./catalog-view";

describe("catalog-view", () => {
  it("toggles tags on and off", () => {
    expect(toggleTag(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleTag(["a", "b"], "a")).toEqual(["b"]);
  });

  it("formats the count label", () => {
    expect(countLabel(2, 5)).toBe("2 件 / 全 5 件");
  });

  it("detects empty queries", () => {
    expect(isEmptyQuery(emptyQuery())).toBe(true);
    expect(isEmptyQuery({ q: "x", type: "all", tags: [] })).toBe(false);
    expect(isEmptyQuery({ q: "", type: "all", tags: ["a"] })).toBe(false);
  });
});
