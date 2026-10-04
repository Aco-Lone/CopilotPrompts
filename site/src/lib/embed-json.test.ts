import { describe, expect, it } from "vitest";
import { serializeForScript } from "./embed-json";

describe("serializeForScript", () => {
  it("escapes characters that could terminate a script element", () => {
    const out = serializeForScript({ t: "</script><!--" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ t: "</script><!--" });
  });

  it("escapes line separators", () => {
    const out = serializeForScript("a\u2028b\u2029c");
    expect(out).not.toMatch(/[\u2028\u2029]/u);
    expect(JSON.parse(out)).toBe("a\u2028b\u2029c");
  });
});
