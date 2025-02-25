---
title: Access Keycloak with Different Hostname
description: In this post, we will learn how to expose Keycloak Administration APIs and UI on different hostname.
pubDate: 2025-02-22
author: Kresna Satya
draft: false
tags: ["keycloak", "gke", "gcp"]
series: "Keycloak Deployment"
---

> This guideline series use Keycloak version 23.0.7.

In this post, we will learn how to expose Keycloak Administration APIs and UI on different hostname. Before we get started, here's a quote from [Keycloak's documentation](https://www.keycloak.org/server/configuration-production).

> **Exposing the Keycloak Administration APIs and UI on a different hostname**

> It is considered a best practice to expose the Keycloak Administration REST API and Console on a different hostname or context-path than the one used for the public frontend URLs that are used e.g. by login flows. This separation ensures that the Administration interfaces are not exposed to the public internet, which reduces the attack surface.

> Access to REST APIs needs to be blocked on the reverse proxy level, if they are not intended to be publicly exposed.

## Preparation

Suppose we have two domains:

1. `iam.domain.tld` for Keycloak Admin Panel + Keycloak REST API.
2. `sso.domain.tld` for SSO provided by Keycloak.

In practical `sso.domain.tld` will be available on public internet and `iam.domain.tld` available on private internet. In order to make it works well, there are three things we need to do:

1. Install NGINX Ingress Controller with service type LoadBalancer on `keycloak-cluster` GKE because we haven't installed yet.
2. Change service type from `LoadBalancer` into `ClusterIP` in `service.yaml` file.
3. We need to bind SSL certificate (fullchain certificate) + private key into Kubernetes secret type `tls`.

> But, why we need to do this?

1. Why install NGINX Ingress Controller with service type LoadBalancer?

- The ingress-nginx controller needs to be accessible from outside the cluster to handle incoming traffic.
- When we use type LoadBalancer in GKE, it automatically:
    - Creates a Google Cloud Load Balancer.
    - Assigns an external/public IP.
    - Handles incoming traffic distribution.
    - Manages SSL/TLS termination at the edge.
- This creates a single entry point for all external traffic, making it easier to:
    - Manage SSL certificates in one place.
    - Configuring routing rules.
    - Monitor traffic.
    - Apply security policies.

2. Why change service from LoadBalancer to ClusterIP in `service.yaml`?

- Having LoadBalancer type service for `keycloak-service` would be:
    - Create additional Google Cloud Load Balancers (unnecessary cost).
    - Expose Keycloak directly without the routing benefit of Ingress.
    - Make SSL/TLS management more complex (need to handle at each service).
    - Make it harder to implement host-based routing.

- Using ClusterIP will be:
    - Keeps Keycloak services internal to the cluster.
    - Forces all traffic through the Ingress controller.
    - Allow the Ingress controller to properly route based on hostnames:
        - `iam.domain.tld` & `sso.domain.tld` -> `keycloak-service`
    - Provides better security as services aren't directly exposed.
    - More cost-effective (only one Load Balancer needed).

So, the traffic flow becomes simpler:

```html
Internet → Load Balancer IP → Ingress Controller → keycloak-service → Keycloak Pods
                                              ↓
                                    Routes based on hostname:
                                    - sso.domain.tld
                                    - iam.domain.tld
```

3. Why we need to bind SSL certificate and private key? In short, for secure our apps + get HTTPS. Also, the SSL certificate must be in fullchain format which contain: domain.crt, intermediate.crt, and domain.crt in single file. It will be like this:

```html
-----BEGIN CERTIFICATE-----
(Base64 encoded certificate data for domain)
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
(Base64 encoded certificate data for intermediate)
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
(Base64 encoded certificate data for root)
-----END CERTIFICATE-----
```

Otherwise, you will get an issue when you access SSO or Keycloak Admin REST API via cURL like this:

> curl: (60) SSL certificate problem: unable to get local issuer certificate

> Honestly, I'm bit frustrated and don't have a clue why and how to solve it? Now, I get a proper and makes sense answer from Artificial Intelligence.

The `"unable to get local issuer certificate"` error occurs precisely because of missing intermediate certificate! The intermediate certificate is VERY important because it creates the trust chain. Let's take an example of Sectigo certificate.

```html
Your Domain Cert → Intermediate Cert → Root CA Cert
(sso.domain.tld) → (Sectigo RSA DV) → (USERTrust RSA)
```

Without the intermediate certificate:

1. Your client (cURL/Guzzle) receivers your domain certificate.
2. It sees it's signed by "Sectigo RSA Domain Validation Secure Server CA".
3. But, it can't verify this signature because it doesn't have the intermediate certificate.
4. Result: Trust chain is broken, causing the error you see.

Why browsers work but curl doesn't:

- Browsers: Maintain their own certificate store with common intermediate certificates
- Curl/Guzzle: More strict, needs the complete chain provided in the TLS connection

This is why including the intermediate certificate in your fullchain.crt is essential - it provides the missing link in the trust chain that programmatic clients need to verify your certificate's authenticity.

## Setup and Apply Changes

1. Install ingress-nginx controller with `helm` command. This command will add ingress-nginx into helm repository. Then, it will install ingress-nginx in `ingress-nginx` namespace and set the type controller into LoadBalancer.

> When you run this command below, it will expose port 80 for HTTP and port 443 for HTTPS. The ingress-nginx recognize the HTTPS and redirect end-user to HTTPS if you set the `tls` in your Ingress config later.

```sh
# Add the ingress-nginx helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install nginx-ingress
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

2. Create TLS secret.

```sh
kubectl create secret tls keycloak-tls-secret \
  --cert=path/to/your.crt \
  --key=path/to/your.key \
  -n keycloak
```

3. Change service type from LoadBalancer into ClusterIP.

```yaml
# ... Same as previous guideline ...
spec:
  type: ClusterIP # <- We change into this.
  # ... Same as previous guideline ...
```

3. Create two Ingress: `keycloak-ingress-public` for `sso.domain.tld` and `keycloak-ingress-admin ` for `iam.domain.tld` in one file named `ingress.yaml`. We attach `tls` secret there.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak-ingress-public
  namespace: keycloak
spec:
  ingressClassName: nginx
  rules:
  - host: sso.domain.tld
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: keycloak-service
            port:
              number: 80
  tls:
  - hosts:
    - sso.domain.tld
    secretName: keycloak-tls-secret
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak-ingress-admin
  namespace: keycloak
spec:
  ingressClassName: nginx
  rules:
  - host: iam.domain.tld
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: keycloak-service
            port:
              number: 80
  tls:
    - hosts:
        - iam.domain.tld
      secretName: keycloak-tls-secret
```

4. Apply changes by run `kubectl apply`.

```sh
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

5. Get the Load Balancer IP:

```sh
kubectl get svc -n ingress-nginx
```

6. Configure DNS:

- Add Add A records in your DNS provider pointing both domains to the Load Balancer IP:
    - `sso.domain.tld` → Load Balancer IP
    - `iam.domain.tld` → Load Balancer IP

## Closing

That's it! You just learn how to access Keycloak with different hostname. By using this approach, you can separate where's the resource that can be accessible via public internet like `sso.domain.tld` and accessible via private internet like `iam.unud.ac.id`.

All files available in GitHub repo: [github.com/senkulabs/keycloak-playground](https://github.com/senkulabs/keycloak-playground) in `k8s/different-hostname-keycloak` folder.