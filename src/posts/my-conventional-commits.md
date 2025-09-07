---
title: My Conventional Commits
description: My Prefix When I do git commit
pubDate: 2025-09-07
author: Kresna Satya
draft: false
---

Last year, I read [a blog post from Theodorus Clarence about git commit message](https://theodorusclarence.com/blog/mindful-commit-message). In his post, he mentions that the commit should be add a prefix in order to able understand which commit is fix for bug, add a feature, upgrade dependencies, and so on. This is also good for filter and search commit messages. He also mentions that the idea come from [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) that popularized by Angular (a JavaScript web framework) team. Now, this thing becomes my new habit each time I make a git commit. Here's my prefixes:

- `feat:` for add and remove feature.
- `fix:` for fix bug and error.
- `refactor:` for refactor code program.
- `chore:` for install deps, upgrade deps, and remove deps.
- `docs:` for add and update documentation.

There's also a variation with exclamation symbol after prefix. This means that this commit is important and we need to take attention like upgrade dependencies.

```sh
chore!: set minimum version of livewire to 3.6.4

This fix security issue on Livewire: GHSA-29cq-5w36-x7w3
```