---
title: Trio Serverless in One Repository
description: Let's explore possibility of merging serverless functions of Cloudflare, Netlify, and Vercel into single repository
pubDate: 2024-09-24
author: Kresna Satya
---

> *2024-12-28: This post updated by add Cloudflare Functions (Pages) as serverless functions into single repository. Then, I give a brief syntax of serverless functions in Cloudflare, Netlify, and Vercel. The demo is a GET request as API and attach it into frontend in order to make a "Fullstack Vibes".*

## Background

Around 2019 until 2020, I continue to play RPG game called Brave Frontier. Actually, I already have this game account since 2014 when I'm in college but I take hiatus because my character level is lower and it's difficult to grinding. Back to 2019, I see Brave Frontier is getting better and there are characters called Omni Unit. This unit is a last evolution of unit like an ultimate power. Also, there are several omni units that have certain power called Dual Brave Burst (DBB). These omni units are useful to conquer quests or special events. Usually, Brave Frontier players use Brave Frontier fandom as source of truth to see recommendation of SP (Specialty Points). Each character have 100 SP and as player we can spend it to get certain buffs.

Here's the problem: the content inside Brave Frontier fandom is too much, not just omni units it self but there are quests, weapons, arena, special events information, and so on. The web has ads and the position of ads is not comfortable for me especially when open in mobile phone. So, I have little idea: make a web that contain information of omni units with SP recommendation and Dual Brave Burst (DBB).

## First Problem: Data

I was thinking that Brave Frontier fandom at that time have REST API endpoints for Omni Units and DBB. But, it doesn't. 😅 So, what should I do? I think about scraping and I see programmers use Python for scraping. Unfortunately, I'm not familar with Python, so I seek an alternative. AHA! I find JavaScript! I can use JavaScript to get the data by query Document Object Model (DOM). I use NodeJS and JSDOM at that time to get the data. I store the data inside JSON and store it inside GitHub repo name `bravefrontier-data`. Then, I set scheduler to get data with GitHub actions.

> *Honestly, JSDOM is too slow. I just want to use fetch API to get text/html data then parse it into DOM. But, NodeJS doesn't support DOMParser. So, I'm seeking alternative and find Linkedom.*

## Second Problem: Web Interface

I'm bad at CSS at that time but now I'm bit confident with my CSS skills, thanks Josh! I don't want to use any popular frameworks or UI libraries JavaScript. But, I'm okay with CSS frameworks. So, I pick HTML, CSS with Tailwind CSS, JavaScript with pagejs library (router for Single Page Application) and Choices JS (select dropdown), and Vite (modern front-end framework). It was hard but exciting because I usually programming for back-end development. This problem teach me how to treat my self as the owner of project and make it to be the best artwork for my self at that time.

> *Before I use Vite, I used Rollup.*

## Third Problem: Glue the Data with Web Interface

To glue the data with Web Interface, I need to build REST API. At that time, I don't want to spent any dollars to built VPS to setup web server for serve the REST API. So, I'm seeking solution and find Vercel. Vercel (formerly Zeit) is amazing platform for fulfill my use case to build REST API by using term called Serverless functions. 

> *Serverless functions in short looks like I create functions inside the Vercel's server and I don't have control about the detail specification of Vercel's server (RAM, storage, bandwith). Vercel indrectly tell me that I don't need to know the detail of their server and just believe them as long as I follow the their serverless functions rule.*

Another wish is I want the REST API and web interface inside one repository or monorepo. Luckily, I find reference from Carlos Roso's post. It works after more tweaks. I give the repo name `bravefrontier-vercel`.

## Last Problem: Can I add Netlify's Serverless Functions?

Last year, I touch this project again although the game has sunset. I want to add Netlify's Serverless Functions inside this project. It's really difficult in my mind. Because, Vercel and Netlify have their rules and I don't have any reference how to do that. So, the quick solution is I create a repo name `bravefrontier-netlify` which is a fork from `bravefrontier-vercel`. It works, but I have another problem: **I HAVE 3 REPOSITORIES IN MY GITHUB ACCOUNT FOR THIS PROJECT!**

1. First, repo for the data which is `bravefrontier-data`. 
2. Second, repo for the Brave Frontier site hosted in Vercel which is `bravefrontier-vercel`. 
3. Third, repo for the Brave Frontier site hosted in Netlify which is `bravefrontier-netlify`. 

I see these as redundant and wasted my time in the future.

At that time, I'm frustrated then I left it for a distant time. In 2024, I back to this project again and do the experiment: Merge those repositories into single repository. Here's the brief structure I want to achieve.

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

The hard part is make this repo follow the netlify and vercel rules. Thanks to Claude.ai, it doesn't need to take around more than hours to solve this. I also implement it in National Holiday API project. So the project can be accessed in Vercel or Netlify.

> Just take a look the vercel.json, netlify.toml, and api directory. Also, at least you familiar little bit with regular expression. Good luck! :)

## Additional Problem: Add Cloudflare Functions. Oh God! 🥲

> *When human has a strong will or strong desire then it will be hard to stop them!*

Yesterday (2024-12-27), I'm curious to add Cloudflare Functions a.k.a. Cloudflare's Serverless Functions into this repo. In my imagination, I was thinking that I just put the Cloudflare functions inside the `api` directory, update the `wrangler.toml`, and tell the Cloudflare that my functions is inside the `api` directory by tweak the `wrangler.toml`.

```sh
.
├── api/
│   ├── cloudflare/
│   │   └── index.js
│   ├── netlify/
│   │   └── index.js
│   └── vercel/
│       └── index.js
└── wrangler.toml
```

But, Cloudflare functions has their own rules and strict. If I want to make serverless functions in Cloudflare then I must put that into `functions` directory. After I do that, everything works well.

```sh
.
├── functions/
│   └── api/
│       └── index.js
├── api/
│   ├── netlify/
│   │   └── index.js
│   └── vercel/
│       └── index.js
└── wrangler.toml
```

## Closing

Luckily, I can make a proof of concept that I can combine serverless functions like Cloudflare, Netlify, and Vercel into single repository a.k.a. monorepo. The monorepo is a "Fullstack Vibes". The front-end just index.html and Tailwind CSS without any popular JS frameworks like React, Svelte, and Vue. The back-end runs by Cloudflare (wrangler), Netlify (Netlify CLI), and Vercel (Vercel CLI).

It's hard and difficult. I don't think this is a better approach if I want to take further like build an app that has complex features. I prefer using JS frameworks like Remix, SvelteKit, and NuxtJS to run this case. Why? Because, I just need to write functions that rules by the frameworks instead of the serverless functions it self.

Here's the syntax you need to use when create a functions in Cloudflare, Netlify, and Vercel.

::: code-group labels=[Cloudflare, Netlify, Vercel]

```js
// NOTE: I use async keyword because maybe you want to fetch data with Fetch API
export async function onRequest(context) {
    // Get query params string with URL class
    // E.g. /api?month=8&year=2020

    const url = new URL(context.request.url);
    const month = url.searchParams.get('month') || '';
    const year = url.searchParams.get('year') || '';

    // Maybe you want to get a slug or single path segment by using context.params
    // E.g. /api/omniunits/cosmic-chef-giselle
    // Source: https://developers.cloudflare.com/pages/functions/routing/#single-path-segments
    const slug = context.params.slug;

    // Return response with Cache-Control
    let result = [];
    let statusCode = 200;
    let response = new Response(JSON.stringify(result), {
        status: statusCode
    });
    
    response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=86400');
    response.headers.set('Content-Type', 'application/json');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');

    return response;
}
```

```js

// Declare headers with Cache-Control
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=0, s-maxage=86400'
};

// Netlify using "handler" naming function as their serverless functions
export const handler = async (event, context) => {
    let result = [];

    // Get query params string with URL class
    // E.g. /api?month=8&year=2020
    let month = event.queryStringParameters.month;
    let year = event.queryStringParameters.year;

    // Maybe you want to get a slug or single path segment by using event.path
    // E.g. https://bravefrontier.netlify.app/api/omniunits/cosmic-chef-giselle
    const pathParts = (event.path) ? event.path.split('/') : [];
    if (pathParts[3]) { // The index of 3 is a hard code value.
        let slug = pathParts[3];
        
        // Return response
        return {
            statusCode: statusCode,
            headers,
            body: JSON.stringify([])
        };
    }
    
    // Return response
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
    };
}
```

```js
export default async (req, res) => {
    // Get query params string with URL class
    // E.g. /api?month=8&year=2020
    
    let month = req.query.month;
    let year = req.query.year;

    // Maybe you want to get a slug or single path segment by using req.query
    // E.g. /api/omniunits/cosmic-chef-giselle
    let slug = req.query.slug;

    let result = [];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
    res.status(200).send(result);
}
```

:::

If you're really curious, please see the GitHub repos in reference section.

**Reference**

1. [How to deploy a monorepo in Vercel - Carlos Roso](https://carlosroso.com/how-to-deploy-a-monorepo-in-vercel/)
2. [Brave Frontier GitHub repo](https://github.kresna.me/bravefrontier)
3. [API Hari Libur GitHub repo](https://github.kresna.me/api-harilibur)