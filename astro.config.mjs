import { defineConfig } from 'astro/config';
import starlight from "@astrojs/starlight";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://dev.kresna.me",
  integrations: [starlight({
    title: "dev.kresna.me"
  }), mdx()]
});