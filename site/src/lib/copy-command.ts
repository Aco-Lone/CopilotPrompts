export interface ClipboardLike {
  writeText(text: string): Promise<void>;
}

export async function copyText(
  text: string,
  clipboard: ClipboardLike | undefined,
): Promise<boolean> {
  if (text.length === 0) {
    throw new Error("Cannot copy an empty command");
  }
  if (!clipboard) {
    return false;
  }
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
