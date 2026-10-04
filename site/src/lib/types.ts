import type { ItemFrontmatter } from "./item-schema";

export interface SiteConfig {
  owner: string;
  repo: string;
  ref: string;
  site: string;
  base: string;
}

export type ItemType = ItemFrontmatter["type"];

export interface CatalogItem extends ItemFrontmatter {
  slug: string;
  body?: string;
}

export interface CatalogIndexEntry {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  normalizedTags: string[];
  type: ItemType;
  updated?: string;
}

export interface CatalogTagCount {
  tag: string;
  count: number;
}

export interface CatalogQuery {
  q: string;
  type: ItemType | "all";
  tags: string[];
}

export type CatalogRepositoryConfig = Pick<SiteConfig, "owner" | "repo" | "ref">;

export interface CatalogDiagnostic {
  path: string;
  key?: string;
  message: string;
}

export interface CatalogValidationResult {
  valid: boolean;
  diagnostics: CatalogDiagnostic[];
}
