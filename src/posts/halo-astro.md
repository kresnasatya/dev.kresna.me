---
title: 'Halo Astro!'
pubDate: 2024-06-01
description: "Astro. Astro Boy? Astro (Korean Boyband)? No! The Astro that I mean is a web framework. At the first time I see Astro, I was thinking that it's a Static Site Generator (SSG) same as Hugo, a fast SSG build with Go programming language. Also, Astro build their engine with Go programming language. Astro offers two features that I could not resist to try it!"
author: 'Kresna Satya'
---

> Note: "Halo" is a word in bahasa Indonesia. In English means "Hi" or "Hello".

Astro. Astro Boy? Astro (Korean Boyband)? No! The Astro that I mean is a web framework. At the first time I see Astro, I was thinking that it's a Static Site Generator (SSG) same as Hugo, a fast SSG build with Go programming language. Also, Astro build their engine with Go programming language. Astro offers two features that I could not resist to try it! 

> Btw, my personal site is using Hugo.

First, the Islands Architecture concept. This concept introduced by Jason Miller (Preact’s creator). I would like to put his explanation here in this post.

> *The general idea of an “Islands” architecture is deceptively simple: render HTML pages on the server, and inject placeholders or slots around highly dynamic regions. These placeholders/slots contain the server-rendered HTML output from their corresponding widget. They denote regions that can then be "hydrated" on the client into small self-contained widgets, reusing their server-rendered initial HTML.*

I imagine placeholders/slots like header, sidebar, and image carousel (wrapped by main HTML tag) in web HTML page. Those things can be static or even dynamic content that loaded by JavaScript. In Astro, they imagine Island Architecture as interactive UI component on the page and they make it more precise with word "**interactive widget** floating in a sea of ​​otherwise static, lightweight, server-rendered HTML.". This **interactive widget** thing triggered an AHA moment for me.

> Widget!? AHA! It remains me with calendar widget, popular posts on Blogspot and WordPress.


Actually, Islands Architecture comes up from “Component Islands” that was created by Katie Sylor. Honestly, I’m pretty sure that around 2019 and 2020, I see a video presentation from Katie Sylor-Miller on YouTube or Vimeo that talks about “Component Islands” but I don’t see it anywhere now. I’m not sure if I’m hallucinate or not, but I’m pretty sure that I’m not hallucinate about it.


Second, Astro provides UI agnostic. It means you can inject your favorite JavaScript framework code to Astro. So far, Astro support Preact, React, Svelte, Vue, Lit, and Solid. I personally will pick Svelte as favorite JavaScript framework although I don't use it seriously in another projects. I love Svelte because syntax brevity and Rich Harris’s marketing and philosophy to build better web development with less headache concepts (I talk about you, ReactJS). I can wait to put Svelte code inside this site in a near future!

This site is on progress. I have several ideas for this site in the futures. The ideas are dual language (English and Bahasa Indonesia), search feature (cmd + k from Jacky Efendi's site), dark mode feature, and mini-playgrounds. I will use English as default language in this site because I would like interact with world-wide programmer, software developer, or anybody who share same interest topics with me.