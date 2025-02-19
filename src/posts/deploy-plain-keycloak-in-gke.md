---
title: Deploy Keycloak in GKE
description: Welcome to Keycloak Deployment series. In this post, I will give you a guideline how to deploy a plain Keycloak in Google Kubernetes Engine.
pubDate: 2025-02-19
author: Kresna Satya
draft: true
---

Welcome to Keycloak Deployment series. This series are guidelines to you and myself related with deploy Keycloak in Kubernetes especially in Google Kubernetes Engine (GKE). Here are the guidelines I want to share with you:

- Deploy Plain Keycloak in GKE
- Deploy Keycloak in GKE with Postgresql Google Cloud SQL Proxy
- Expose Keycloak Administration APIs and UI on different hostname
- Add Keycloak Health checks into Keycloak in Kubernetes
- Increase Replica, Implement Sticky Session, and Implement Distributed Cache

Each guideline will be turn into a blog post and each guideline is a continuation of the previous guideline. So, first let's started with the first guideline: Deploy Plain Keycloak in GKE.

## What is Keycloak?

Keycloak is an open source Identity and Access Management (IAM) created by Red Hat. If you have heard about Single Sign-On, OAuth2, OpenID Connect, SAML2, or login with Google, login with Apple, then they are a part of Identity and Access Management.

What is Identity and Access Management (IAM)? In simple term, IAM is a mechanism to manage identity and access of end-user or human. Identity related with who the is the user and Access is related with what access the user have. Think it in real world, for example you are a guest of the hotel, the hotel staff have the identity data of who you are and the access you have in the hotel. The access can be many forms like you can have breakfast, lunch, and dinner in the restaurant, you have access to the private pool, you have access to the villa. This access based on your request when you book the hotel. 

## What is Kubernetes?

I'm still beginner in this area. But, if I can say about Kubernetes, you can imagine yourself as a composer's orchestra in music world. You as composer manage the group of musicians who holds flute, piano, violin, etc. Think the group musicians as collection of Docker containers. In Kubernetes, your 80% of time will be interact with the terms like `deployment`, `service`, `secret`, `configmap`, and `ingress`.

> Here's my wisdom: First, you will be confuse. Second, you will be learn. Third, you will be understand what's going on here.

## Deploy Plain Keycloak in GKE

> The instructions below will be executed in Cloud Shell in console.cloud.google.com.

> You may have enable the APIs of Google Cloud Platform in order to make instructions work. Don't worry, you can enable the APIs via Cloud Shell or Google Cloud Platform website.

### Setup Kubernetes Engine & Cluster

> In order to get the value of Project ID, you may execute command below.

```sh
gcloud config get-value project
```

```sh
# Activate Kubernetes API
gcloud services enable container.googleapis.com --project=<project-id-value>

# Create cluster with 3 nodes with machine type e2-standard-2.
gcloud container clusters create keycloak-cluster \
    --region asia-southeast2 \
	--num-nodes 3 \ 
    --machine-type e2-standard-2
    
# Configure kubectl to interact with your cluster
gcloud container clusters get-credentials keycloak-cluster --region asia-southeast2

# Verify cluster is working
# Check nodes
kubectl get nodes

# Check basic system pods
kubectl get pods -n kube-system

# Create Keycloak namespace
kubectl create namespace keycloak
```