---
title: 'I Built a Browser Engine in Swift. But Why?'
pubDate: 2026-03-31
description: 'In short is curiosity. For long reason read the post.'
author: 'Kresna Satya'
draft: false
---

## Intro

I don't know exactly when. But, I have a dream to shift my career from a web developer into web browser engineer. I would like to make it happen soon. At the time this post is published, there are popular browser engines in this world:

- WebKit for Safari
- Chromium (Blink) for Google Chrome
- Gecko for Firefox
- Servo
- LibWeb for Ladybird

The moment that have trigger me to have desire to make a browser engine was when Ladybird is announced. It's a new browser engine that created from scratch by [Andreas Kling](https://awesomekling.github.io) (he was ex-Apple who works for WebKit - as far as I follow him on Twitter and I watch him YouTube). In a video, Andreas mentioned that he and the team have [a plan to move the Ladybird code from C/C++ into Swift](https://www.youtube.com/watch?v=DSEZ2ZYLdHg). I'm curious and waiting when that day happen but it doesn't happen. Instead [Andreas and the team decide to move it into Rust with help from AI](https://ladybird.org/posts/adopting-rust/) - because the C/C++ interopability on Swift doesn't match the expectation criteria from them. Honestly, I'm sad because I really wanna see the browser engine build with Swift - mix with C/C++ interopability - oh, hi [Skia](https://github.com/google/skia) and [Harfbuzz](https://github.com/harfbuzz/harfbuzz).

Then, I made a try for create a browser engine with Swift rather than waiting and waiting the perfect situation is coming.

> No one is perfect, but making progress moves you closer to it.

## A Plan

So, I want to make a browser engine with Swift. It doesn't have to be perfect or using fancy things like C/C++ interopability that can integrate with Skia or Harfbuzz or even use it widely. I just want to make a browser engine that can read URL, parse the content URL with HTMLParser, CSSParser, and JavaScript Engine then show it in a page in a tab. That's it for a good start. But, I need a solid and robust resource to teach me how to make a web browser. 

> No no no. Please don't suggest me the WHATWG HTML Standard. It's too too too big. 😵‍💫

Luckily I found it, the [Browser Engineering book](https://browser.engineering) - created by Pavel Panchekha and Chris Harrelson. This books covers the foundation how to make the web browser using Python. I have follow the chapter since October 2025 and using the Python as the authors suggest. I save it into a GitHub repository called [brownie](https://github.com/kresnasatya/brownie). Now, I'm in the last chapter and soon it will be finished. :)

Before I mention the plan, I will give you three reason why I choose Swift as programming language to make a browser engine:

**1. Curiousity**

Since the Ladybird team decided to move their C/C++ code base into Rust instead of Swift. Then, my desire for build web browser engine with Swift much bigger. I don't want to miss the chance.

**2. Everything is Object**

Everything is object. The web has [Document Object Model (DOM)](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model). Swift has Object Oriented Programming. That's it.

> Well, you can ask Claude with this prompt below to get detail answers.
> How does the DOM relate to Swift's OOP model in the context of building a browser engine?

**3. The SwiftUI**

In the end, we need to build a browser - desktop app on top the browser engine that build with Swift to show the result that we can see. Luckily, I'm using Apple product like MacBook - macOS and it has access to the SwiftUI. Then, I don't need to waste my time at this moment to seeking the GUI desktop engine. :)

## Execution

Now, Artificial Intelligence has turned into Large Language Model (LLM) that turned into a product called Claude (one of them). The code program is no longer mystery. The another mystery is the meaning of the code program and it's impact to the sofware. As programmer you need to learn programming language in the AI era. You still have the job to write the high quality code that produce the high software and optimize it!

Let's start for the execution. At the first try, I just throw all the things from the brownie and tell the Claude to port it into Swift. Errrr... It doesn't work as expected. Then, I change my workflow. 

First, I split the parts of brownie into three parts (branches):

- Part 1 - branch `ch01-10`: It covers chapter 1 (Downloading Web Pages) to 10 (Keeping Data Private)
- Part 2 - branch `ch11-14`: It covers chapter 11 (Adding Visual Effects) to 14 (Making Content Accessible)
- Part 3 - branch `ch15-16`: It covers chapter 15 (Supporting Embedded Content) to 16 (Reusing Previous Computation)

Second, I create a Swift project for web browser engine. I called it `ToyStack`.

```sh
# Swift convention name for project name is PascalCase
mkdir ToyStack
cd ToyStack
# By default swift will create package for type Library.
# But I set the type to be Executable because I execute a program to run a browser
# So, you will get Sources directory, .gitignore file, and Package.swift
swift package init --type=executable --name ToyStack
```

Inside the ToyStack I put the brownie project (I don't forget to ignore the brownie) and switch into `ch01-10`. Then, I start chat with Claude with the prompt like this.

> I want to make a browser engine with Swift programming language. Currently, I have brownie - a browser engine with Python that comes from Browser Engineering book. Your task is read the Python code inside the brownie and porting it into Swift. Create a plan with step by step which one is first, second, and so on. In the end, you're a guider and give me the code BUT you're NOT ALLOWED to edit the code. I'm a learner and will re-type the code program to get better understanding of the meaning of code.

Now, the ToyStack has cover until the chapter 14 along with some exercise that comes from the Browser Engineering. The ToyStack doesn't have any third-party dependencies. The rendering engine is built from scratch by follow the Browser Engineering book. Meanwhile for JavaScript engine, I use JavaScriptCore (Safari) instead of build from scratch. Maybe I will make it using Swift too in the future.

## Closing

Thanks to the help from AI, the code is no longer mystery and build a "toy" browser engine can be done in days to weeks. But, for the real-world browser engine is another story. My experience when make the browser engine with Swift is mixed feeling. Mostly, I'm confused with the output of code program because I have around 5 to 20% familiarity with Swift programming language. Even along with the Web Browser term like Chrome - it's a control for managing tabs, back and forward button, address bar input, bookmark site. I was thinking the Chrome is just the product name of Google Chrome. 🙈

If I want to make a description on how the browser engine works maybe like this:

- Everything starts from URL
- The URL contains information: html tags along with CSS (`<style>` or <link rel="stylesheet">`) and JavaScript (`<script>` or `<script src="">`)
- Then, you have two parser and one engine: HTML parser, CSS parser, and JavaScript engine. Those are used for parsing the tags into the DocumentLayout.
- From DocumentLayout to BlockLayout. From BlockLayout into LineLayout, InputLayout, and ButtonLayout or even ImageLayout.
- The layout result is inside a tab.
- Each tab are managed by a Chrome.
- Then, close the tab and browser window. Get out and enjoy the real-life. :)

The ToyStack doesn't finished yet. There are things that is still on going - add features and optimized. Maybe I wanna play a game inside the ToyStack one day. ;)

GitHub repository: [kresnasatya/ToyStack](https://github.com/kresnasatya/ToyStack).