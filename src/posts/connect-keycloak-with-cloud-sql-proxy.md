---
title: Connect Keycloak with Cloud SQL Proxy
description: This is a guideline for connect Keycloak with Cloud SQL Proxy provided by Google Cloud Platform.
pubDate: 2025-02-21
author: Kresna Satya
draft: true
tags: ["keycloak", "cloud sql proxy", "gke", "gcp"]
series: "Keycloak Deployment"
---

Previously, we deploy the plain Keycloak on Google Kubernetes Engine (GKE). The word of "plain" means that the data stored on Keycloak is not persistent because it stores on Keycloak embedded database. Think embedded database as SQLite. Now, each time you change the deployment configuration, the container will be re-create and the data is gone.

> We don't want this happen in production, right?

This guideline shows you about how to use persistent database like PostgreSQL to store Keycloak's data. We create PostgreSQL on Cloud SQL which is a part of Google Cloud Platform products. To connect Keycloak with PostgreSQL, we use Cloud SQL Auth Proxy provided by Cloud SQL.

## Prerequisite

In order to make this guideline work, you must follow the guideline: [Deploy Plain Keycloak on GKE](/posts/deploy-plain-keycloak-on-gke).

## Create PostgreSQL Database

1. Create a Cloud SQL PostgreSQL instance name `keycloak-db` with `gcloud` command. I use tier `db-perf-optimized-N-2` which has 2 vCPUs, 16GB RAM, 375GB Local SSD. You may free to choose region. I choose `asia-southeast2` personal choice for data sovereign.

```sh
gcloud sql instances create keycloak-db \
    --database-version=POSTGRES_16 \
    --region=asia-southeast2 \
    --root-password=<plain-text> \
    --tier=db-perf-optimized-N-2
```

2. Create database with name `keycloak` in `keycloak-db` instance.

```sh
gcloud sql databases create keycloak --instance=keycloak-db
```

3. Create user for `keycloak` database in `keycloak-db` instance for database authentication.

```sh
gcloud sql users create keycloak \
    --instance=keycloak-db \
    --password=<plain-text>
```

4. If you cannot create database on Cloud SQL, maybe you need to enable Cloud SQL Admin API first.

```sh
gcloud services enable sqladmin.googleapis.com
```

## Connect Keycloak with PostgreSQL via Cloud SQL Proxy

1. Create service account with name `keycloak-cloudsql-proxy` with display name `Keycloak Cloud SQL Proxy`.

```sh
gcloud iam service-accounts create keycloak-cloudsql-proxy \
    --display-name="Keycloak Cloud SQL Proxy"
```

2. We will store the `project-id` value in variable name `PROJECT_ID`. This will be use in the next steps.

```sh
# Get your project ID & store it in a variable
PROJECT_ID=$(gcloud config get-value project)
```

3. Add role `roles/cloudsql.client` into `keycloak-cloudsql-proxy`.

> Attention! You may need have the access as owner of project otherwise you will get an error like this.

> ERROR: (gcloud.projects.add-iam-policy-binding) 
> [user@company.com] does not have permission to access projects instance [project-id:setIamPolicy] (or it may not exist): Policy update access denied. This command is authenticated as user@company.com which is the active account specified by the [core/account] property.

```sh
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:keycloak-cloudsql-proxy@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
```

4. Create and download service account key

```sh
gcloud iam service-accounts keys create keycloak-cloudsql-key.json \
    --iam-account=keycloak-cloudsql-proxy@$PROJECT_ID.iam.gserviceaccount.com
```

5. Create Kubernetes secret with type `generic` and the name is `cloudsql-instance-credentials`. We create this secret on `keycloak` namespace.

```sh
kubectl create secret generic cloudsql-instance-credentials \
    --from-file=credentials.json=keycloak-cloudsql-key.json \
    -n keycloak
```


## Closing