---
title: Connect Keycloak with Cloud SQL Auth Proxy
description: This is a guideline for connect Keycloak with Cloud SQL Auth Proxy provided by Google Cloud Platform.
pubDate: 2025-02-21
author: Kresna Satya
draft: false
tags: ["keycloak", "cloud sql proxy", "gke", "gcp"]
series: "Keycloak Deployment"
---

> This guideline series use Keycloak version 23.0.7.

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

## Connect Keycloak with PostgreSQL via Cloud SQL Auth Proxy

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

6. Add credentials database into `secrets.yaml` file. Use base64-encoded value.

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: keycloak-secret
  namespace: keycloak
type: Opaque
data:
  # Use this command below to convert the plain value into base64 encode:
  # echo -n "<plain-value>" | base64
  # ...
  DB_USERNAME: <base64-encoded>
  DB_PASSWORD: <base64-encoded>
```

> NOTE: The `# ...` means that the configurations are same as previous guideline.

7. Add cloudsql proxy container into deployment file and add Keycloak environments into Keycloak container.

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak-deployment
  namespace: keycloak
  labels:
    app: keycloak
spec:
  replicas: 3
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      volumes:
        - name: cloudsql-instance-credentials
          secret:
            secretName: cloudsql-instance-credentials
      containers:
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.1.0
          args:
            - "--structured-logs"
            - "--port=5432"
            - "--credentials-file=/secrets/cloudsql/credentials.json"
            - "project-id:asia-southeast2:keycloak-db"
          volumeMounts:
            - name: cloudsql-instance-credentials
              mountPath: /secrets/cloudsql
              readOnly: true
          ports:
            - containerPort: 5432
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"
        - name: keycloak
          image: asia-southeast2-docker.pkg.dev/project-id/project-id/keycloak:latest
          args:
            - "start"
          env:
          # ...
          - name: KC_DB
            value: "postgres"
          - name: KC_DB_URL
            value: "jdbc:postgresql://localhost:5432/keycloak"
          # ...
```

> NOTE: The `# ...` means that the configurations are same as previous guideline.

As you can see, we also update the env on Keycloak container by set the `KC_DB` to `"postgres"` and `KC_DB_URL` to `"jdbc:postgresql://localhost:5432/keycloak"`. Why we set to localhost? Because we use Cloud SQL Auth Proxy approach.

Now, let's apply the change files with `kubectl apply` command. Then, everything should be works now!

```sh
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
```

## Cloud SQL Auth Proxy

Here are features and benefits from Cloud SQL Auth Proxy:

- Adds a sidecar container running the Cloud SQL Auth Proxy.
- Keycloak connects to `localhost:5432` which is forwarded to Cloud SQL.
- Requires service account with proper permissions. That's why we create `keycloak-cloudsql-key` service account and bind them in to Kubernetes as `generic` secret type.
- Better for production use.

> What is sidecar container?

A sidecar container is a design pattern in Kubernetes where you run an additional container alongside your main application container in the same pod. Think of it like a motorcycle sidecar - it's attached to the main vehichle but serves a supporting role.

In Keycloak deployment, we have two containers:

1. Main container: `keycloak` (main application)
2. Sidecar container: `cloud-sql-proxy` (the supporting container)

Proxies/Adapters is one of common use cases of sidecar container.

```yaml
containers:
  - name: cloud-sql-proxy   # Sidecar
    image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.1.0
    # ... proxy configuration ...
  - name: keycloak         # Main container
    image: quay.io/keycloak/keycloak:23.0.7
    # ... main app configuration ...
```

Benefits of using sidecars:

- Separation of concerns
- Each container can be updated independently
- Containers in the same pod can communicate via localhost
- Share resources and storage volumes
- Die and scale together with the main container

In your Keycloak case, the Cloud SQL proxy sidecar:

- Handles secure database connectivity
- Manages authentication with Google Cloud
- Provides a local endpoint (localhost:5432) for Keycloak to connect to
- Encrypts traffic between your application and Cloud SQL

## Closing

That's it! You just learn how to connect Keycloak into PostgreSQL with Cloud SQL Auth Proxy. By using persistent database like PostgreSQL your data still saved even you change the configuration of container and restart the container. I hope this guide helps you!

All files available in GitHub repo: [github.com/senkulabs/keycloak-playground](https://github.com/senkulabs/keycloak-playground) in `k8s/cloudsql-proxy-keycloak` folder.