import { describe, expect, it } from "vitest";
import { buildGigetCommand } from "./download-command";
import type { CatalogRepositoryConfig } from "./types";

const validConfig: CatalogRepositoryConfig = {
  owner: "Aco-Lone",
  repo: "CopilotPrompts",
  ref: "main",
};

describe("buildGigetCommand [CMD-001..005, OVR-003]", () => {
  it("builds the exact deterministic single-line command [CMD-001/002]", () => {
    const command = buildGigetCommand("review-agent", validConfig);

    expect(command).toBe(
      "npx giget@latest gh:Aco-Lone/CopilotPrompts/catalog/review-agent#main ./review-agent",
    );
    expect(command).not.toMatch(/[\r\n]/u);
    expect(buildGigetCommand("review-agent", validConfig)).toBe(command);
  });

  it("accepts a valid ref containing path separators [CMD-003]", () => {
    expect(buildGigetCommand("review-agent", { ...validConfig, ref: "feature/catalog-v2" })).toContain(
      "#feature/catalog-v2 ",
    );
  });

  it("rejects invalid slugs with an error naming slug [CMD-003]", () => {
    expect(() => buildGigetCommand("Review Agent", validConfig)).toThrow(/slug/i);
  });

  it.each([
    ["owner", "evil;echo", validConfig],
    ["repo", "repo name", validConfig],
    ["ref", "main && echo unsafe", validConfig],
  ] as const)("rejects an invalid %s value with the key named in the error [CMD-004/005]", (key, value, base) => {
    const config = { ...base, [key]: value } as CatalogRepositoryConfig;

    expect(() => buildGigetCommand("review-agent", config)).toThrow(new RegExp(key, "i"));
  });
});
