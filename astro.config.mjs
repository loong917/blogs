import { defineConfig } from 'astro/config';
import rehypeJournal from './src/plugins/rehype-journal.mjs';

export default defineConfig({
    site: 'https://loongzxl.com',
    compressHTML: true,
    devToolbar: {
        enabled: false,
    },
    markdown: {
        gfm: true,
        smartypants: true,
        syntaxHighlight: 'shiki',
        shikiConfig: {
            theme: 'css-variables',
            wrap: true,
        },
        rehypePlugins: [rehypeJournal],
    },
});
