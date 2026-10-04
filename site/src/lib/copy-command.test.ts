import { describe, expect, it, vi } from "vitest";
import { copyText } from "./copy-command";

describe("copyText", () => {
  it("returns ok when clipboard succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyText("cmd", { writeText })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("cmd");
  });

  it("returns false when clipboard rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    await expect(copyText("cmd", { writeText })).resolves.toBe(false);
  });

  it("returns false when clipboard is unavailable", async () => {
    await expect(copyText("cmd", undefined)).resolves.toBe(false);
  });

  it("rejects empty commands", async () => {
    await expect(copyText("", { writeText: vi.fn() })).rejects.toThrow();
  });
});
