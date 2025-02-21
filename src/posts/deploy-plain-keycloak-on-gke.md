---
title: Deploy Plain Keycloak on GKE
description: Welcome to Keycloak Deployment series. In this post, I will give you a guideline how to deploy a plain Keycloak on Google Kubernetes Engine.
pubDate: 2025-02-19
author: Kresna Satya
draft: false
tags: ["keycloak", "gke", "gcp"]
series: "Keycloak Deployment"
---

Welcome to Keycloak Deployment series. This series are guidelines to you and myself related with deploy Keycloak on Kubernetes especially on Google Kubernetes Engine (GKE). Here are the guidelines I want to share with you:

- Deploy Plain Keycloak on GKE
- Connect Keycloak with Postgresql Google Cloud SQL Proxy
- Expose Keycloak Administration APIs and UI on different hostname
- Add Keycloak Health checks into Keycloak
- Increase Replica, Implement Sticky Session, and Implement Distributed Cache

Each guideline will be turn into a blog post and each guideline is a continuation of the previous guideline. So, first let's started with the first guideline: Deploy Plain Keycloak on GKE.

## What is Keycloak?

Keycloak is an open source Identity and Access Management (IAM) created by Red Hat. If you have heard about Single Sign-On, OAuth2, OpenID Connect, SAML2, or login with Google, login with Apple, then they are a part of Identity and Access Management.

What is Identity and Access Management (IAM)? In simple term, IAM is a mechanism to manage identity and access of end-user or human. Identity related with who the is the user and Access is related with what access the user have. Think it in real world, for example you are a guest of the hotel, the hotel staff have the identity data of who you are and the access you have in the hotel. The access can be many forms like you can have breakfast, lunch, and dinner in the restaurant, you have access to the private pool, you have access to the villa. This access based on your request when you book the hotel. 

## What is Kubernetes?

I'm still beginner in this area. But, if I can say about Kubernetes, you can imagine yourself as a composer's orchestra in music world. You as composer manage the group of musicians who holds flute, piano, violin, etc. Think the group musicians as collection of Docker containers. In Kubernetes, your 80% of time will be interact with the terms like `deployment`, `service`, `secret`, `configmap`, and `ingress`.

> Here's my wisdom: First, you will be confuse. Second, you will be learn. Third, you will be understand what's going on here.

## Deploy Plain Keycloak on GKE

> The instructions below will be executed in Cloud Shell in console.cloud.google.com.

> You may have enable the APIs of Google Cloud Platform in order to make instructions work. Don't worry, you can enable the APIs via Cloud Shell or Google Cloud Platform website.

### Setup Kubernetes Engine & Cluster

> In order to get the value of Project ID, you may execute command below.

```sh
gcloud config get-value project
```

1. Activate Kubernetes API

```sh
gcloud services enable container.googleapis.com --project=<project-id-value>
```

2. Create a Kubernetes cluster. In this guideline, I create cluster with name `keycloak-cluster`.
It has 3 nodes with machine type `e2-standard-2` and region in `asia-southeast2`.

```sh
gcloud container clusters create keycloak-cluster \
    --region asia-southeast2 \
	--num-nodes 3 \ 
    --machine-type e2-standard-2
```

3. Get credentials from Kubernetes cluster in order to make interaction with the `keycloak-cluster` with `kubectl` command.
    
```sh
gcloud container clusters get-credentials keycloak-cluster --region asia-southeast2
```

4. Verify cluster is working and check basic system pods.

```sh
# Check nodes
kubectl get nodes

# Check basic system pods
kubectl get pods -n kube-system
```

5. Create namespace named `keycloak`. This is intended for grouping the Keycloak project.

```sh
kubectl create namespace keycloak
```

## Create Secret File

Secret file used for store username and password administrator to access Keycloak Admin console. The value of put in the secret file is base64 encoded. Don't worry, Kubernetes recognize the base64 encoded value.

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: keycloak-secret
  namespace: keycloak
type: Opaque
data:
  KEYCLOAK_ADMIN: <base64-encoded>
  KEYCLOAK_ADMIN_PASSWORD: <base64-encoded>
```

To convert plain value into base64 encoded value, you can use the command below.

```sh
echo -n "<plain-value>" | base64
# e.g.
echo -n "admin" | base64
```

## Create Deployment File

If you have been try create a Docker Compose file, then you will be slightly familiar with Deployment file in Kubernetes.
In short, the Deployment act as place to create pod, replica pod, create containers and manage resources for containers.

```sh
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak-deployment
  namespace: keycloak
  labels:
    app: keycloak
spec:
  replicas: 1
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
        - name: keycloak
          image: quay.io/keycloak/keycloak:23.0.7
          args:
            - "start"
          env:
          - name: KC_HTTP_ENABLED
            value: "true"
          - name: KC_HOSTNAME_STRICT
            value: "false"
          - name: KC_PROXY
            value: "edge"
          - name: KEYCLOAK_ADMIN
            valueFrom:
              secretKeyRef:
                name: keycloak-secret
                key: KEYCLOAK_ADMIN
          - name: KEYCLOAK_ADMIN_PASSWORD
            valueFrom:
              secretKeyRef:
                name: keycloak-secret
                key: KEYCLOAK_ADMIN_PASSWORD
          - name: JAVA_OPTS
            value: "-Xms512m -Xmx1024m"
          envFrom:
            - secretRef:
                name: keycloak-secret
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          ports:
          - name: http
            containerPort: 8080
```

## Create Service File

Service is a thing you want to expose your container application from one or more pods in your cluster.
Now, we will expose the container app in a service in order to make it accessible in the internet.

```sh
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: keycloak-service
  namespace: keycloak
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: keycloak
```

We create service called `keycloak-service` and it target the container port `8080` that we have defined in `deployment.yaml`.
Then, we expose it into the public with port `80`. Also, we must target to the selector app `keycloak` as we defined in `deployment.yaml`.

## Apply Configuration Files

We finish create the configuration files: secrets.yaml, deployment.yaml, and service.yaml. Now, it's time to apply the configuration. We will use command `kubectl apply -f <filename>`.

```sh
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

> Question: What will happened if you apply service.yaml first before the deployment.yaml?

<p style="margin-bottom: 16rem; font-size: 1.5rem;"><strong>3</strong></p>
<p style="margin-bottom: 16rem; font-size: 1.5rem;"><strong>2</strong></p>
<p style="margin-bottom: 16rem; font-size: 1.5rem;"><strong>1</strong></p>

> It will be failed! Because service needs target the container port `8080`, selector app `keycloak` which come from the `deployment.yaml` file.

Congrats! Now you can access your keycloak with external IP address provided by `keycloak-service` LoadBalancer. To get the external IP address, run command below:

```sh
kubectl get service -n keycloak
```

To check logs of Keycloak container run command:

```sh
kubectl logs -l app=keycloak -n keycloak -c keycloak
```

## Apply Change Configuration Files

If you want to update the update of configuration files, you just need to update the to run `kubectl delete -f <filename>` then run `kubectl apply -f <filename>`

## Closing

That's it! I hope this guide help you and I wish you learn a thing or many things here! Thank you for reading!

All files available in GitHub repo: [github.com/senkulabs/keycloak-playground](https://github.com/senkulabs/keycloak-playground) in `k8s/plain-keycloak` folder.