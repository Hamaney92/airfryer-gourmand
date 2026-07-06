import { defineCollection, z } from 'astro:content';

const recipes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().optional(),
    description: z.string(),
    category: z.string(),
    keyword: z.string(),
    rating: z.number().default(4.8),
    reviews: z.number().default(0),
    prepTime: z.number().default(5),
    cookTime: z.number().default(15),
    servings: z.number().default(2),
    temp: z.string(),
    image: z.string().optional(),
    quickAnswer: z.string(),
    ingredients: z.array(z.string()).default([]),
    steps: z.array(z.string()).default([]),
    tips: z.array(z.string()).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    pubDate: z.coerce.date().default(() => new Date()),
  }),
});

export const collections = { recipes };
