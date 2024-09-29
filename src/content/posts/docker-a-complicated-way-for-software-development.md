---
title: Docker, A Complicated Way for Software Development
pubDate: 2024-09-27
description: Let's bet with our local machine when develop sofware because Docker is complicated.
author: Kresna Satya
---

> Software Development NOT Software Deployment!

Docker, one of implementation of containers debutted at PyCon in 2023 (source: WikiPedia). I use Docker in 2018. Until this day, I just know several commands in Docker like docker compose, docker build, docker exec, and docker inspect. I think those commands enough for me to use Docker. Back to my statement.

> Why I see Docker is complicated way for software development?

At that time, I develop a [Larva Interactions project](https://larva-interactions.fly.io), a project that use Laravel framework. I use Laravel Herd as a main tool to develop this project. I use DBngin and TablePlus as tools for interacting with database like MySQL, Postgresql, and Redis. Actually, it's more than enough. But, I'm curious can I bring Docker as a tool for develop this project? How comfortable is it compare with Laravel Herd, DBngin, and TablePlus? The answers: Yes, I can use Docker to develop this project and no for the comfortable zone. Laravel has Laravel Sail but I create my custom Dockerfile and Docker Compose using [serversideup/docker-php](https://github.com/serversideup/docker-php).

> Why it makes me not comfort?

The answer is in `.env` file and php artisan command. Imagine when the first time you clone the Laravel project. Then, you build Docker image (install deps included), create a container. You open localhost inside browser, it doesn't work! Why? Because the project has .dockerignore file which ignore .env file. So, I need to go to inside the container, create a .env file, then run `php artisan key:generate` inside the container. Which is NO for me! Luckily, I already have the tools I need for develop Laravel project like Laravel Herd, DBngin, and Table Plus. These tool are more than enough for me! Let Docker do the job as software deployment tool. Anyway, I watch the [Aaron Francis video: No more Docker for PHP](https://youtu.be/sY2A6AGF5os?si=bAGjA5QjZk8xDtDp). This video shares the same opinion like I mention above. You must watch it!