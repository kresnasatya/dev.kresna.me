import { defineConfig } from 'astro/config';
import rehypeCodeGroup from 'rehype-code-group';

// https://astro.build/config
export default defineConfig({
  site: "https://dev.kresna.me",
  markdown: {
    rehypePlugins: [
      rehypeCodeGroup
    ]
  }
});