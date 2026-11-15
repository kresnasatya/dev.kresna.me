# dev.kresna.me

This site created [with Astro](https://astro.build), [the awesome rocket mustache](https://x.com/_kresnasatya/status/1680709309448208385).

## Instructions

1. Git clone.
2. `bun install`.
3. `bun run dev`.

To create post, you just run `bun run new {post-title-slug}`.

```sh
bun run new ai-still-needs-you
```

This will create `ai-still-needs-you.md` inside `src/posts`.

## Diagrams

Write [Mermaid](https://mermaid.js.org) syntax in a ```` ```mermaid ```` code block inside a post. [Pele](https://pele.run) renders it to SVG in the browser (`src/components/PeleDiagrams.astro`).