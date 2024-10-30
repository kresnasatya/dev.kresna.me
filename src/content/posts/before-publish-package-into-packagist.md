---
title: Before Publish Package into Packagist
pubDate: 2024-10-30
description: Use Version Control System (VCS) hosting like GitHub or GitLab.
author: Kresna Satya
---

One month ago, I build a project named Larva Interactions. This project gives programmer example how to make components or implement a usecase using Laravel + Livewire + AlpineJS + TailwindCSS. In each example, I would like to add a code snippets how to create the component or the usecase. I love HTML but the Markdown is a winner to create a code snippet. Just use triple backtick (```) then put your code inside it then close it with triple backtick again. Done. Instead in HTML, you maybe put `<pre><code>code snippets here<code></pre>`. But, it's bit complicated to organize indentation, etc.

Luckily, there are community packages like `league/commonmark` to parse markdown into HTML, `laravel/unfenced` to detect special sign in markdown then convert into interactive HTML (Alpine), and `torchlight/torchlight-commonmark`. But, there's a problem with `torchlight` package. It doesn't get updated into latest Laravel version. I was confused and clueless what should I do.

> Should I fork the package then rename it then publish into a packagist?

No! This is terrible. Luckily, [someone tell to fork the project then set the location for download the package into VCS](https://github.com/torchlight-api/torchlight-commonmark-php/pull/10#issuecomment-2155192395) by editing `repositories` and `require` in `composer.json` file.

```json
"require": {
    "torchlight/torchlight-commonmark": "dev-main",
},
"repositories": [
    {
        "type": "vcs",
        "url": "git@github.com:senkustream/torchlight-commonmark-php.git"
    }
]
```

Then, run `composer update`. Finish! That's it. In [Composer's documentation, it tells us that we can use VCS as an option to download the package](https://getcomposer.org/doc/05-repositories.md#loading-a-package-from-a-vcs-repository). Here's the quote.

> There are a few use cases for this. The most common one is maintaining your own fork of a third party library. If you are using a certain library for your project, and you decide to change something in the library, you will want your project to use the patched version. If the library is on GitHub (this is the case most of the time), you can fork it there and push your changes to your fork. After that you update the project's composer.json. All you have to do is add your fork as a repository and update the version constraint to point to your custom branch. In composer.json only, you should prefix your custom branch name with "dev-" (without making it part of the actual branch name).

Now, I will do this as an habit before I'm pretty sure that my package is ready to publish into Packagist.