import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/notes" }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    description: z.string(),
  }),
});

export const collections = { notes };
