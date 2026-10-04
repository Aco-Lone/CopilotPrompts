export function extractScriptSrcs(html: string): string[] {
  const srcs: string[] = [];
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gu)) srcs.push(m[1]!);
  for (const m of html.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*\bhref="([^"]+)"/gu)) srcs.push(m[1]!);
  return [...new Set(srcs)].filter((s) => s.startsWith("/"));
}
