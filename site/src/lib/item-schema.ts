import { z } from "zod";

const semVerPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function characterCount(value: string): number {
  return Array.from(value).length;
}

function hasCharacterLength(value: string, minimum: number, maximum: number): boolean {
  const length = characterCount(value);
  return length >= minimum && length <= maximum;
}

function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0 || month < 1 || month > 12) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysPerMonth[month - 1]!;
}

const titleSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => hasCharacterLength(value, 1, 80), {
    message: "must contain 1-80 characters after trimming",
  });

const summarySchema = z
  .string()
  .refine((value) => !/[\r\n\u2028\u2029]/u.test(value), {
    message: "must not contain a newline",
  })
  .transform((value) => value.trim())
  .refine((value) => hasCharacterLength(value, 1, 200), {
    message: "must contain 1-200 characters after trimming",
  });

const tagSchema = z
  .string()
  .refine((value) => hasCharacterLength(value, 1, 30), {
    message: "must contain 1-30 characters",
  })
  .refine((value) => !/[\s,]/u.test(value) && !/[\s,]/u.test(value.normalize("NFKC")), {
    message: "must not contain whitespace or commas",
  });

const tagsSchema = z
  .array(tagSchema)
  .min(1, { message: "must contain at least one tag" })
  .max(10, { message: "must contain at most 10 tags" })
  .superRefine((tags, context) => {
    const firstIndexByNormalizedTag = new Map<string, number>();

    tags.forEach((tag, index) => {
      if (tag.length === 0) {
        return;
      }

      const normalized = normalizeTag(tag);
      const firstIndex = firstIndexByNormalizedTag.get(normalized);
      if (firstIndex !== undefined) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: `duplicates tag at index ${firstIndex} after NFKC and lowercase normalization`,
        });
      } else {
        firstIndexByNormalizedTag.set(normalized, index);
      }
    });
  });

export const itemSchema = z
  .object({
    title: titleSchema,
    summary: summarySchema,
    tags: tagsSchema,
    type: z.enum(["agent", "skill", "prompt", "bundle"]),
    version: z.string().regex(semVerPattern, { message: "must be a valid SemVer 2.0.0 version" }).optional(),
    author: z.string().refine((value) => hasCharacterLength(value, 1, 50), {
      message: "must contain 1-50 characters",
    }).optional(),
    updated: z.string().refine(isRealDate, {
      message: "must be a real date in YYYY-MM-DD format",
    }).optional(),
  })
  .strict();

export type ItemFrontmatter = z.infer<typeof itemSchema>;

export function validateSlug(slug: string): boolean {
  if (typeof slug !== "string") {
    throw new TypeError("slug must be a string");
  }

  return slug.length >= 1 && slug.length <= 64 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

export function normalizeTag(tag: string): string {
  if (typeof tag !== "string") {
    throw new TypeError("tag must be a string");
  }
  if (tag.length === 0) {
    throw new RangeError("tag must not be empty");
  }

  return tag.normalize("NFKC").toLowerCase();
}
