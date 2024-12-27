---
title: Duo Serverless in One Repository
description: Let's explore possibility of merging Netlify and Vercel in single repository
pubDate: 2024-09-24
author: Kresna Satya
---

## Background

Around 2019 until 2020, I continue to play RPG game called Brave Frontier. Actually, I already have this game account since 2014 when I'm in college but I take hiatus because my character level is lower and it's difficult to grinding. Back to 2019, I see Brave Frontier is getting better and there are characters called Omni Unit. This unit is a last evolution of unit like an ultimate power. Also, there are several omni units that have certain power called Dual Brave Burst (DBB). These omni units are useful to conquer quests or special events. Usually, Brave Frontier players use Brave Frontier fandom as source of truth to see recommendation of SP (Specialty Points). Each character have 100 SP and as player we can spend it to get certain buffs.

Here's the problem: the content inside Brave Frontier fandom is too much, not just omni units it self but there are quests, weapons, arena, special events information, and so on. The web has ads and the position of ads is not comfortable for me especially when open in mobile phone. So, I have little idea: make a web that contain information of omni units with SP recommendation and Dual Brave Burst (DBB).

## First Problem: Data

I was thinking that Brave Frontier fandom at that time have REST API endpoints for Omni Units and DBB. But, it doesn't. 😅 So, what should I do? I think about scraping and I see programmers use Python for scraping. Unfortunately, I'm not familar with Python, so I seek an alternative. AHA! I find JavaScript! I can use JavaScript to get the data by query Document Object Model (DOM). I use NodeJS and JSDOM at that time to get the data. I store the data inside JSON and store it inside GitHub repo name `bravefrontier-data`. Then, I set scheduler to get data with GitHub actions.

> Honestly, JSDOM is too slow. I just use fetch API to get text/html data then parse it into DOM. But, NodeJS doesn't support DOMParser. So, I'm seeking alternative and find Linkedom.

## Second Problem: Web Interface

I'm bad at CSS at that time but now I'm bit confident with my CSS skills, thanks Josh! I don't want to use any popular frameworks or UI libraries JavaScript. But, I'm okay with CSS frameworks. So, I pick HTML, CSS with TailwindCSS, JavaScript with pagejs library (router for Single Page Application) and Choices JS (select dropdown), and ViteJS (modern front-end framework). It was hard but exciting because I usually programming for back-end development. This problem teach me how to layout and treat my self as the owner of project and I want it to be the best artwork for my self at that time.

> I update the project by using ViteJS version 4 and before that I use Rollup.

## Third Problem: Glue the Data with Web Interface

To glue the data with Web Interface, I need to build REST API. At that time, I don't want to spent any dollars to built VPS, and setup web server to serve the REST API. So, I'm seeking solution and find Vercel. Vercel (formerly Zeit) is amazing for fulfill my use case to build REST API by using term called Serverless functions. 

> Serveless functions in short looks like I store my functions or endpoints inside the Vercel's server and I don't have control about the detail specification of Vercel's server (RAM, storage, bandwith) and Vercel indrectly tell to me that I don't need to know and just believe into Vercel as long as I follow the Vercel's serverless functions rule.

It's quite easy and now I get another problem. I want the REST API and web interface inside one repository or monorepo. Luckily, I find reference from Carlos Roso's post. I try and it works. I give the repo name `bravefrontier-vercel`.

## Last Problem: Can I add Netlify inside the Monorepo?

Last year, I touch this project again although the game has sunset. I look my code, update the dependencies, update Vercel rules (the hard one), and it works. At that time, I want to add Netlify inside this project it's really difficult. Because, Vercel and Netlify have their rules and I don't have any reference how to do that. So, the quick solution is I create a repo name `bravefrontier-netlify` which is a fork from `bravefrontier-vercel`. I tweak the serverless functions to follow the Netlify rules and it works. Then, I see a problem: **I HAVE 3 REPOSITORIES IN MY GITHUB ACCOUNT FOR THIS PROJECT!**

1. First, repo for the data. 
2. Second, repo for the Brave Frontier site hosted in Vercel. 
3. Third, repo for the Brave Frontier site hosted in Netlify. 

I see these as redundant and wasted my time in the future.

At that time, I'm frustrated then I left it for a distant time. In 2024, I back to this project again and do the experiment: Merge those repositories into single repository. Here's the brief structure to achieve the ideal.

```sh
.
├── data/
│   ├── dbb.json
│   └── omniunits.json
├── api/
│   ├── vercel/
│   │   ├── omniunits/
│   │   │   └── index.js
│   │   └── dbbs/
│   │       └── index.js
│   └── netlify/
│       ├── omniunits/
│       │   └── index.js
│       └── dbbs/
│           └── index.js
├── js/ **components, routers, utilities**
├── scrapers/ **scraper service**
├── vercel.json
└── netlify.toml
```

The hard part is make this repo follow the netlify and vercel rules. Thanks to Claude.ai, it doesn't need to take around more than hours to solve this. I also implement it in API Hari Libur Nasional project. So the project can be accessed in Vercel or Netlify.

> Just take a look the vercel.json, netlify.toml, and api directory. Also, at least you familiar little bit with regular expression. Good luck! :)

**Reference**

1. [How to deploy a monorepo in Vercel - Carlos Roso](https://carlosroso.com/how-to-deploy-a-monorepo-in-vercel/)
2. [Brave Frontier GitHub repo](https://github.kresna.me/bravefrontier)
3. [API Hari Libur GitHub repo](https://github.kresna.me/api-harilibur)