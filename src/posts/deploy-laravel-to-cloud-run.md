---
title: Deploy Laravel into Google Cloud Run
description: A TLDR how to deploy Laravel project into Google Cloud Run.
pubDate: 2025-09-05
author: Kresna Satya
draft: false
---

In my previous company, I get a privilege to try Google Cloud Run. Google Cloud Run is a part of Google Cloud Platform to run serverless or container-based app. I test how to deploy Laravel project into Cloud Run (services and jobs) using Server Side Up docker-php and it works! I will give you brief summary what I have done to make deploy Laravel to Cloud Run:

1. Set `LOG_STACK` value to `single`. This is recommended option when you want to get trace errors and info in container mode.
2. You will manage the credentials using Secret Manager (a product of Google Cloud Platform) instead of `.env` to manage credentials.
3. Please see [senkulabs/logcatcher](https://github.com/senkulabs/logcatcher) for Laravel project with Server Side Up docker-php and [senkulabs/infracode-talker](https://github.com/senkulabs/infracode-talker) for `webapp.yaml` (cloud run service) and `scheduler.yaml` (cloud run job) for Cloud Run configuration.

Well, have fun!