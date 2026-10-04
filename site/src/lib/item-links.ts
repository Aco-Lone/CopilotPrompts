import type { CatalogRepositoryConfig } from "./types";

export function buildSourceUrl(slug: string, config: CatalogRepositoryConfig): string {
  return `https://github.com/${config.owner}/${config.repo}/tree/${config.ref}/catalog/${slug}`;
}

export function buildFileUrl(
  slug: string,
  filePath: string,
  config: CatalogRepositoryConfig,
): string {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${config.owner}/${config.repo}/blob/${config.ref}/catalog/${slug}/${encoded}`;
}
