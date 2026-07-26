import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: "https://dev.kresna.me",
  markdown: {
    shikiConfig: {
      themes: {
        light: 'monokai',
        dark: 'github-dark'
      }
    }
  },
  i18n: {
    locales: ["en", "id"],
    defaultLocale: "en"
  }
});