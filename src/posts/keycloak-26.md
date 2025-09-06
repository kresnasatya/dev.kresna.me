---
title: Keycloak 26
description: Life goes on and so on Keycloak. Let's see what's changed on Keycloak 26
pubDate: 2025-09-06
author: Kresna Satya
draft: false
---

In October 2024, [Keycloak released new cycle version software](https://www.keycloak.org/2024/10/release-updates). This happens because there are many number of breaking changes increased in the last couple years and it makes Keycloak take much efforts to fix security vulnerabilities. Started on version 26.0 (October 2024), Keycloak will ship 4 minor releases every year, and major release every 2 - 3 years. I think this is a good approach. As programmer who used Keycloak in production, it takes big efforts to upgrade Keycloak version incrementally. In my previous company, we used Keycloak version was 22.0.5 that was released on October 2023. It takes 4 times upgrade from 22.0.5 to 26.0. Also at that time, we used on-premise Kubernetes setup with Rancher but it doesn't running well. Fortunately, in January 2025, the company made an agreement with Google Cloud Platform, so we can ship the Keycloak software on cloud instead of on-premise. As we know, if we ship the software on cloud platform, they guarantee the server stability and up-time up to 99.9%. But, we must purchase the more costs as we trust to the up-time and server stability on cloud. Well, I think it pays off as long us we put correct configuration and specification for sandbox and production environments.

## A TLDR

### Keycloak 23

In Keycloak version 23, we tweak ingress yaml configuration by add session affinity and proxy buffer size. The proxy buffer size used because the length of JWT transfered after authentication callback happened.

```yaml
annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "AUTH_SESSION_ID"
    nginx.ingress.kubernetes.io/proxy-buffer-size: "128k"
```

> You may read my post: [Implement Distributed Cache on Keycloak](./implement-distributed-cache-on-keycloak.md).

### Keycloak 24

In Keycloak version 24, the cookie has been re-write. It also impact with session affinity. So, we don't need to declare session affinity on ingress. We only need to set proxy buffer size.

```yaml
annotations:
    nginx.ingress.kubernetes.io/proxy-buffer-size: "128k"
```

Next, the `KC_PROXY` rename into KC_PROXY_HEADERS. Previously, we use value `edge` now the value changed to `xforwarded`.

```diff
- name: KC_PROXY
- value: "edge"
+ name: KC_PROXY_HEADERS
+ value: "xforwarded"
```

We also omit the `JAVA_OPTS` value because it's unnecessary.

### Keycloak 25

I make a mistake in previous Keycloak setup. The `KC_FEATURES` can only enabled in Docker build image NOT in the run time. So, I omit it from `deployment.yaml` file and move it into `Dockerfile`. Also, the kind value of k8s deployment [must be `StatefulSet` instead of `Deployment` because I set replication](https://spacelift.io/blog/statefulset-vs-deployment#kubernetes-statefulset-and-deployment-use-cases) on Keycloak production.

```yaml
spec:
  replicas: 3
```

Also, Keycloak version 25 has option store online user sessions and online client sessions in database. This will allow a user to stay logged in if all instances of Keycloak are restarted or upgraded.

```sh
KC_FEATURES=persistent-user-sessions
```

### Keycloak 26

- The [user session persisted by default in database](https://www.keycloak.org/docs/latest/upgrading/index.html#all-user-sessions-are-persisted-by-default). So, we can omit the `persistent-user-sessions` in `KC_FEATURES`.

- Keycloak use Marshalling to [implement distributed cache on Keycloak](./implement-distributed-cache-on-keycloak.md). Marshalling is the process of converting Java objects into bytes to send them accross the network between Keycloak servers. In Keycloak version 26, [the marshalling format changed from JBoss Marshalling to Infinispan Protostream](https://www.keycloak.org/docs/latest/upgrading/index.html#infinispan-marshalling-changes). In other words, we must set down the previous replicas and up the new one.

```yml
- kubectl scale statefulset keycloak-deployment -n keycloak --replicas=0
- kubectl scale statefulset keycloak-deployment -n keycloak --replicas=3
- kubectl rollout status statefulset keycloak-deployment -n keycloak
```

## Closing

That's a TLDR of upgrade Keycloak version. I would like to say that I can see the simplicity, more robust, and more stable on Keycloak as a SSO platform since version 26. I will looking for [impersonate feature as a part of standard token exchange on Keycloak in the future](https://www.keycloak.org/2025/05/standard-token-exchange-kc-26-2).