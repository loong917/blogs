import { z, defineCollection } from 'astro:content';

const blogCollection = defineCollection({
    type: 'content',
    schema: z.object({
        id: z.number(),
        title: z.string(),
        date: z.string(),
        image: z.string(),
        tags: z.array(z.string()),
        summary: z.string().optional(),
    }),
});

export const collections = {
    'blogs': blogCollection,
};
