import siteConfig from "../../site.config";

export function siteUrl(path: string): string {
  const base = siteConfig.base.replace(/\/+$/u, "");
  const normalizedPath = path.replace(/^\/+/u, "");
  return `${base}/${normalizedPath}`;
}
