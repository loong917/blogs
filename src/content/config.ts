// 1. 从 `astro:content` 导入
import { z, defineCollection } from 'astro:content';
// 2. 定义集合
const blogCollection = defineCollection({
    type: 'content', // v2.5.0 及之后
    schema: z.object({
        id: z.number(),
        title: z.string(),
        date: z.string(),
        image: z.string(),
        tags: z.array(z.string()),
    }),
});
// 3. 导出一个 `collections` 对象来注册集合
export const collections = {
    'blogs': blogCollection,
};