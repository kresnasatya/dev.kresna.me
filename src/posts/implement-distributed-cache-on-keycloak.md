---
title: Implement Distributed Cache On Keycloak
description: In this post, we will learn how to implement distributed cache on Keycloak.
pubDate: 2025-02-25
author: Kresna Satya
draft: false
tags: ["keycloak", "gke", "gcp"]
series: "Keycloak Deployment"
---

> This guideline series use Keycloak version 23.0.7.

Wow! We cover a lot in this series. Previously, we learn how to expose Keycloak Administration APIs and UI on different hostname. Now, it's time to expand the power of Keycloak in production mode on Kubernetes. This post will guide you how to implement distributed cache on Keycloak. Get ready for your hands dirty folks!

## Increase Replica to N

So far, we just use 1 replica in our deployment file. But, we will update the replica to N. The value of N may vary, in this case I set the value of N to 3. Here's the snippet of deployment.yaml file.

```yaml
# deployment.yaml
spec:
  replicas: 3
  template:
    spec:
      containers:
      # ... Same as previous guideline
```

That's it! Then, apply the change with command `kubectl apply -f deployment.yaml`. Try, to login into the Admin Console and see what's going on after you successful logged in.

### Error 1: Redirect Loop

I bet you will see the and error page from you browser. I take from Mozilla as example.

> The page isn’t redirecting properly

> Firefox has detected that the server is redirecting the request for this address in a way that will never complete.

> This problem can sometimes be caused by disabling or refusing to accept cookies.

I was confused a bit when I see the error. At that time, I don't know what's going on! I make guesses at that time:

1. Is that because I set the value `KC_PROXY="edge"`?
2. Is that because I set the value of replica to 3?

The second guess is the answer. When you increase your replica to N like 2 or above, Keycloak will need a way to figure out which pod currently user access the Keycloak and Keycloak need to stick their sessions across the pods in order to prevent the redirect loop issue. You may need to read [**Enable sticky sessions from Keycloak Docs in order to get the full picture**](https://www.keycloak.org/server/reverseproxy#_enable_sticky_sessions). In this post, I will take a piece of docs and I put in here.

> Typical cluster deployment consists of the load balancer (reverse proxy) and 2 or more Keycloak servers on private network. For performance purposes, it may be useful if load balancer forwards all requests related to particular browser session to the same Keycloak backend node.

> For example if authentication session with ID 123 is saved in the Infinispan cache on node1, and then node2 needs to lookup this session, it needs to send the request to node1 over the network to return the particular session entity.

> From this point, it is beneficial if load balancer forwards all the next requests to the node2 as this is the node, who is owner of the authentication session with ID 123 and hence Infinispan can lookup this session locally. After authentication is finished, the authentication session is converted to user session, which will be also saved on node2 because it has same ID 123 .

> The sticky session is not mandatory for the cluster setup, however it is good for performance for the reasons mentioned above. You need to configure your loadbalancer to stick over the **AUTH_SESSION_ID** cookie. The appropriate procedure to make this change depends on your loadbalancer.

If I access the Admin Console login page then open the browser console in tab Storage > Cookies. I see the **AUTH_SESSION_ID** has value like this: 

> a4b14215-dfac-42cc-97b8-034ed7ae3af9.keycloak-deployment-5795676955-n24qs-34838

Keycloak creates the cookie **AUTH_SESSION_ID** with the format <session-id>.<owner-node-id>. The session id is `a4b14215-dfac-42cc-97b8-034ed7ae3af9` and the owner of node id is `keycloak-deployment-5795676955-n24qs-34838`.

In summary, we need to tell our loadbalancer which is ingress-nginx to stick over the **AUTH_SESSION_ID** cookie in order to solve the redirect loop issue. So, let's get started!

### Fix Error 1: Redirect Loop

Let's update the `ingress.yaml` file by using `nginx.ingress.kubernetes.io/affinity` and `nginx.ingress.kubernetes.io/session-cookie-name` annotations.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak-ingress-public
  namespace: keycloak
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "AUTH_SESSION_ID"
spec:
  ingressClassName: nginx
  # ... Same as previous guideline
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
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "AUTH_SESSION_ID"
spec:
  ingressClassName: nginx
  # ... Same as previous guideline
  tls:
    - hosts:
        - iam.domain.tld
      secretName: keycloak-tls-secret
```

Then, apply the change by run `kubectl apply -f ingress.yaml`. Try again and it works now.

Please visit [github.com/senkulabs/keycloak-playground](https://github.com/senkulabs/keycloak-playground) then search `k8s/distributed-cache/part1` for the complete files.

## Enable Distributed Cache

Keycloak support two cache stacks: `jdbc-ping` (default) and `kubernetes` which we will use right now. By using cache, the Keycloak server can reduce their roundtrip to fetch or request data like `authenticationSessions` for example. Authentication sessions are created whenever a user tries to authenticate. They are automatically destroyed once the authentication process completes or due to reaching their expiration time.

The `authenticationSessions` distributed cache is used to store authentication sessions and any other data associated with it during the authentication process. By relying on a distributable cache, authentication sessions are available to any node in the cluster so that users can be redirected to any node without losing their authentication state.

However, production-ready deployments should always consider session affinity and favor redirecting users to the node where their sessions were initially created. By doing that, you are going to avoid unnecessary state transfer between nodes and improve CPU, memory, and network utilization.

> Based on my understanding, I think that's the reason we enable the sticky sessions in the previous section.

Ok! Let's update the deployment.yaml file.

```yaml
# deployment.yaml
spec:
  template:
    spec:
      containers:
        - name: keycloak
          image: asia-southeast2-docker.pkg.dev/project-id/project-id/keycloak:latest
          args:
            - "start"
          env:
          - name: KC_CACHE
            value: "ispn"
          - name: KC_CACHE_STACK
            value: "kubernetes"
          - name: JAVA_OPTS_APPEND
            value: "-Djgroups.dns.query=keycloak-service.keycloak.svc.cluster.local"
          # ... Same as previous guideline
```

First, we add `KC_CACHE="ispn"` because the distributed cached on Keycloak is built on top of [Infinispan](https://infinispan.org/), a high-performance, distributable in-memory data grid. Second, we add `KC_CACHE_STACK="kubernetes"` because we want to use this stack. Third, we add `JAVA_OPTS_APPEND="-Djgroups.dns.query=keycloak-service.keycloak.svc.cluster.local"` because this is a Kubernetes DNS in order to make each pod communicate and share the caches in a cluster. 

Let's break down the format of Kubernetes DNS:

> `keycloak-service.keycloak.svc.cluster.local`.

1. `keycloak-service`: The service name.
2. `keycloak`: namespace.
3. `svc`: Indicate this is a service.
4. `cluster.local`: The default DNS domain for Kubernetes cluster.

So, in other words looks like this:

> `<service-name>.<namespace>.svc.cluster.local`

Ok, let's apply the update by run `kubectl apply -f deployment.yaml` and see what happen after you success login in Admin Master Console.

### Error 2: 401 Unauthenticated

So, maybe you can get inside the Admin Master Console after successful login and maybe not. Then, you will see the 401 HTTP code in your Admin Master Console page or in browser console. This happen because the `authenticationSessions` cache doesn't distribute across the pods. So, in my understanding like this. In the login page, you're facing with pod1. Then, after you successful login, then the pod2 will redirect you into the Admin Master Console page. But, the pod2 doesn't have information of the `authenticationSessions` cache from pod1, so you will get 401 HTTP code.

We can also check the logs with command `kubectl logs -n keycloak <keycloak-pod-name> -c keycloak | grep -i "jgroups\|dns\|bind\|cluster"` to get the output message related with jgroups, dns, bind, and cluster. Here's the output:

```html
Appending additional Java properties to JAVA_OPTS: -Djgroups.dns.query=keycloak-service.keycloak.svc.cluster.local
2025-02-19 04:38:37,640 INFO  [org.infinispan.CLUSTER] (keycloak-cache-init) ISPN000078: Starting JGroups channel ISPN with stack kubernetes
2025-02-19 04:38:37,644 INFO  [org.jgroups.JChannel] (keycloak-cache-init) local_addr: f829b1c3-5389-4aea-9bb7-8ea9541af869, name: keycloak-deployment-c65548c97-sjhf4-16255
2025-02-19 04:38:37,671 INFO  [org.jgroups.protocols.FD_SOCK2] (keycloak-cache-init) server listening on *.57800
2025-02-19 04:38:39,741 INFO  [org.jgroups.protocols.pbcast.GMS] (keycloak-cache-init) keycloak-deployment-c65548c97-sjhf4-16255: no members discovered after 2003 ms: creating cluster as coordinator
2025-02-19 04:38:39,756 INFO  [org.infinispan.CLUSTER] (keycloak-cache-init) ISPN000094: Received new cluster view for channel ISPN: [keycloak-deployment-c65548c97-sjhf4-16255|0] (1) [keycloak-deployment-c65548c97-sjhf4-16255]
2025-02-19 04:38:39,941 INFO  [org.infinispan.CLUSTER] (keycloak-cache-init) ISPN000079: Channel ISPN local address is keycloak-deployment-c65548c97-sjhf4-16255, physical addresses are [10.28.3.20:7800]
2025-02-19 04:56:47,602 WARN  [org.jgroups.protocols.TCP] (TcpServer.Acceptor[7800]-1,keycloak-deployment-c65548c97-sjhf4-16255) JGRP000006: 10.28.3.20:7800: failed accepting connection from peer Socket[addr=/10.28.4.27,port=41611,localport=7800]: java.io.EOFException
```

In the log above, we see an important message:

```html
keycloak-deployment-c65548c97-sjhf4-16255: no members discovered after 2003 ms: creating cluster as coordinator
```

This means the pod keycloak-deployment-c65548c97-sjhf4 is **starting its own cluster** instead of joining an existing one, which breaks the distributed cache. The other message is:

```html
JGRP000006: 10.28.3.20:7800: failed accepting connection from peer Socket[addr=/10.28.4.27,port=41611,localport=7800]: java.io.EOFException
```

This suggests **connectivity issues** between Keycloak nodes over JGroups.

The root cause is in `keycloak-service.keycloak.svc.cluster.local` in `jgroups.dns.query`. JGroups cannot discover all pods in service type clusterIP and JGroups can **discover all pods via DNS**. To solve this, we need to create a headless service by setting `clusterIP: None` in our service.yaml file. This allows DNS querys to return all pod IPs and JGroups DNS_PING needs to discover all individual pod IPs to form the cluster. This enables proper peer discovery for the distributed cache. Also, we need to expose the port 7800 and 57800 in Keycloak container.

> What is JGroups?

> According to JGroups homepage: JGroups is a toolkit for reliable messaging. It can be used to create clusters whose nodes can send messages to each other.

> Ok! it makes sense now!

### Fix Error 2: 401 Unauthenticated

Let's update the deployment.yaml and service.yaml files.

In deployment.yaml file, we update the value of `JAVA_OPTS_APPEND` + expose port `7800` and `57800` in order to be accessible by headless service.

```yaml
# deployment.yaml
spec:
  template:
    spec:
      containers:
        - name: keycloak
          image: asia-southeast2-docker.pkg.dev/project-id/project-id/keycloak:latest
          args:
            - "start"
          env:
          # ... Same as previous section
          - name: JAVA_OPTS_APPEND
            value: "-Djgroups.dns.query=keycloak-discovery.keycloak.svc.cluster.local"
          # ... Same as previous guideline
          ports:
          - name: http
            containerPort: 8080
          - name: jgroups-bind
            containerPort: 7800
          - name: jgroups-fd
            containerPort: 57800
```

In service.yaml, we add new line separated with `---` and define `keycloak-discovery` service. This service bind the port `7800` and `57800` in order to make JGroups can discover all pods in Kubernetes DNS.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: keycloak-service
  namespace: keycloak
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: keycloak
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak-discovery
  namespace: keycloak
spec:
  clusterIP: None
  ports:
  - port: 7800
    targetPort: 7800
    protocol: TCP
    name: jgroups-bind
  - port: 57800
    targetPort: 57800
    protocol: TCP
    name: jgroups-fd
  selector:
    app: keycloak
```

Run `kubectl apply -f deployment.yaml && kubectl apply -f service.yaml`. Then, check logs again with command `kubectl logs -n keycloak <keycloak-pod-name> -c keycloak | grep -i "jgroups\|dns\|bind\|cluster"` and you will see expected logs like this:

```html
Received new cluster view for channel ISPN: [keycloak-deployment-5556b54567-wgdsr|1] (3) [keycloak-deployment-wgdsr, keycloak-deployment-xyz, keycloak-deployment-abc]
```

Please visit [github.com/senkulabs/keycloak-playground](https://github.com/senkulabs/keycloak-playground) then search `k8s/distributed-cache/part2` for the complete files.

## Extra

When you integrate Keycloak SSO with many client apps, there will be a case that you will get 502 Bad Gateway Nginx. If we check the log with command `kubectl logs` in ingress-nginx namespace, we will get interesting log message:

```html
2025/02/20 08:04:12 [error] 713#713: *202851 upstream sent too big header while reading response header from upstream
```

This means that the backend server (upstream) in this case is Keycloak, is sending a response header that is larger than Nginx's configured buffer size. To solve this issue, we will increase the proxy-buffer-size greater than 4k which is the default value.

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak-ingress-public
  namespace: keycloak
  annotations:
    # ... Same as previous section
    nginx.ingress.kubernetes.io/proxy-buffer-size: "128k"
spec:
  ingressClassName: nginx
  # ... Same as previous guideline
  tls:
  - hosts:
    - sso.unud.ac.id
    secretName: keycloak-tls-secret
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak-ingress-admin
  namespace: keycloak
  annotations:
    # ... Same as previous section
    nginx.ingress.kubernetes.io/proxy-buffer-size: "128k"
spec:
  ingressClassName: nginx
  # ... Same as previous guideline
  tls:
    - hosts:
        - iam.unud.ac.id
      secretName: keycloak-tls-secret
```

Apply the change with command `kubectl apply -f ingress.yaml` and everything works properly. Please visit [github.com/senkulabs/keycloak-playground](https://github.com/senkulabs/keycloak-playground) then search `k8s/distributed-cache/extra` for the complete files.

## Closing

That's it! We learn how to implement distributed cache on Keycloak in Kubernetes environment. Thanks for reading!