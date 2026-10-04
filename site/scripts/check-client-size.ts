import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import siteConfig from "../site.config";
import { extractScriptSrcs } from "../src/lib/client-size";

const LIMIT = 50 * 1024;
const dist = new URL("../dist/", import.meta.url).pathname;
const base = siteConfig.base.replace(/\/+$/u, "");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : [],
  );
}

let failed = false;
for (const file of htmlFiles(dist)) {
  const srcs = extractScriptSrcs(readFileSync(file, "utf8"));
  const total = srcs.reduce((sum, src) => {
    const path = src.startsWith(`${base}/`) ? src.slice(base.length) : src;
    return sum + gzipSync(readFileSync(join(dist, path))).length;
  }, 0);
  const ok = total <= LIMIT;
  failed ||= !ok;
  console.log(`${ok ? "OK  " : "FAIL"} ${file.slice(dist.length)}: ${total} B gzip (limit ${LIMIT})`);
}
process.exit(failed ? 1 : 0);
