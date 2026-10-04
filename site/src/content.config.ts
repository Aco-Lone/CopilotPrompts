import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";
import { itemSchema } from "./lib/item-schema";

// Astro parses unquoted YAML date scalars as Date objects; validation uses the original date-only form.
const collectionSchema = z.preprocess((data) => {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return data;
  }

  const frontmatter = data as Record<string, unknown>;
  if (!(frontmatter.updated instanceof Date) || Number.isNaN(frontmatter.updated.getTime())) {
    return data;
  }

  return { ...frontmatter, updated: frontmatter.updated.toISOString().slice(0, 10) };
}, itemSchema);

const items = defineCollection({
  loader: glob({
    // [BLD-001/002] Match only item-root READMEs and use the containing folder as the entry ID.
    pattern: "*/README.md",
    base: new URL("../../catalog/", import.meta.url),
    generateId: ({ entry }) => entry.replace(/\\/gu, "/").split("/")[0] ?? entry,
  }),
  schema: collectionSchema,
});

export const collections = { items };
