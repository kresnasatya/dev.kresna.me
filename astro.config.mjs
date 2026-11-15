import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: "https://dev.kresna.me",
  markdown: {
    // Leave ```mermaid blocks as plain <pre><code class="language-mermaid">
    // so Pele can render them in the browser (see src/components/PeleDiagrams.astro).
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['math', 'mermaid']
    },
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