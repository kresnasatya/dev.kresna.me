#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

const POSTS_DIR = path.join(__dirname, 'src/posts');

function slugToTitle(slug) {
  return slug
    .replace(/\.md$/, '')
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateFrontmatter(title) {
  const today = formatDate(new Date());
  return `---
title: '${title}'
pubDate: ${today}
description: ''
author: 'Kresna Satya'
draft: true
---

`;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node new-post.js <slug-of-post>');
    console.error('Example: node new-post.js ai-still-needs-you');
    process.exit(1);
  }

  const slug = args[0];

  // Ensure .md extension
  const filename = slug.endsWith('.md') ? slug : `${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  // Check if file already exists
  if (fs.existsSync(filepath)) {
    console.error(`Error: Post already exists at ${filepath}`);
    process.exit(1);
  }

  // Ensure posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const title = slugToTitle(filename);
  const content = generateFrontmatter(title);

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`Post created: ${filepath}`);
}

main();
