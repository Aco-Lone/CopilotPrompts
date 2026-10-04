import type { CatalogRepositoryConfig } from "./types";

import { validateSlug } from "./item-schema";

const ownerPattern = /^[A-Za-z0-9_.-]+$/u;
const repoPattern = /^[A-Za-z0-9_.-]+$/u;
const refPattern = /^[A-Za-z0-9._/-]+$/u;

function validateConfigValue(
  key: keyof CatalogRepositoryConfig,
  value: unknown,
  pattern: RegExp,
): asserts value is string {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw new Error(`Invalid ${key}: value contains unsupported characters or is empty`);
  }
}

export function buildGigetCommand(slug: string, config: CatalogRepositoryConfig): string {
  if (!validateSlug(slug)) {
    throw new Error(`Invalid slug: ${slug}`);
  }

  validateConfigValue("owner", config.owner, ownerPattern);
  validateConfigValue("repo", config.repo, repoPattern);
  validateConfigValue("ref", config.ref, refPattern);

  return `npx giget@latest gh:${config.owner}/${config.repo}/catalog/${slug}#${config.ref} ./${slug}`;
}
