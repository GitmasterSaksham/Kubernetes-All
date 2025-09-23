# The Complete Kubernetes Guide: From Basics to Master Level

## Table of Contents

1. [Introduction to Kubernetes](#introduction-to-kubernetes)
2. [Kubernetes Architecture](#kubernetes-architecture)
3. [Core Concepts](#core-concepts)
4. [Kubernetes Objects and Resources](#kubernetes-objects-and-resources)
5. [Networking in Kubernetes](#networking-in-kubernetes)
6. [Storage in Kubernetes](#storage-in-kubernetes)
7. [Security and RBAC](#security-and-rbac)
8. [Configuration Management](#configuration-management)
9. [Workload Management](#workload-management)
10. [Service Mesh](#service-mesh)
11. [Monitoring and Observability](#monitoring-and-observability)
12. [Advanced Topics](#advanced-topics)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)
15. [Commands Reference](#commands-reference)

---

## 1. Introduction to Kubernetes

### What is Kubernetes?

Kubernetes (K8s) is an open-source container orchestration platform that automates deploying, scaling, and managing containerized applications. It was originally developed by Google and is now maintained by the Cloud Native Computing Foundation (CNCF).

**Detailed Theory:**
Kubernetes acts as the "operating system" for containerized applications in a distributed environment. While Docker creates and runs containers on a single machine, Kubernetes manages containers across multiple machines (nodes) in a cluster. It abstracts away the complexity of managing distributed systems by providing:

- **Declarative Configuration**: You describe what you want (desired state) rather than how to achieve it
- **Self-healing**: Automatically replaces failed containers and reschedules them on healthy nodes
- **Horizontal Scaling**: Can automatically add or remove container instances based on demand
- **Load Distribution**: Distributes network traffic across multiple instances of your application
- **Rolling Updates**: Updates applications without downtime by gradually replacing old instances
- **Service Discovery**: Containers can find and communicate with each other automatically

**Why Kubernetes Exists:**
Before Kubernetes, managing containerized applications at scale required significant manual effort. You had to:
- Manually start containers on different machines
- Monitor container health and restart failed ones
- Manually distribute load across containers
- Handle networking between containers on different machines
- Manually update applications without downtime

Kubernetes automates all these tasks, making it possible to run thousands of containers across hundreds of machines with minimal human intervention.

### Key Benefits

- **Container Orchestration**: Manages containers across multiple hosts
- **Auto-scaling**: Automatically scales applications based on demand
- **Self-healing**: Automatically replaces failed containers
- **Service Discovery**: Built-in load balancing and service discovery
- **Rolling Updates**: Zero-downtime deployments
- **Resource Management**: Efficient resource utilization

### Kubernetes vs Docker

| Aspect | Docker | Kubernetes |
|--------|--------|------------|
| Purpose | Container Runtime | Container Orchestration |
| Scope | Single Host | Multi-Host Cluster |
| Scaling | Manual | Automatic |
| Networking | Basic | Advanced (CNI) |
| Storage | Volumes | Persistent Volumes |
| Load Balancing | Limited | Built-in |

---

## 2. Kubernetes Architecture

### Master Node Components

#### 1. API Server (kube-apiserver)
**What it does:**
- Central management component
- Exposes Kubernetes API
- Validates and processes API requests
- Gateway to the cluster

**Detailed Theory:**
The API Server is the heart of Kubernetes - it's the component that everything else talks to. Think of it as the "front desk" of your Kubernetes cluster. Every operation you perform (creating pods, services, deployments) goes through the API Server.

**Key Functions:**
1. **Authentication & Authorization**: Verifies who you are and what you're allowed to do
2. **Validation**: Ensures your YAML configurations are correct and follow Kubernetes rules
3. **Admission Control**: Applies policies and may modify requests before processing
4. **Storage Interface**: Persists all cluster data to etcd
5. **RESTful Interface**: Provides HTTP API endpoints for all Kubernetes operations

**How it works:**
When you run `kubectl apply -f deployment.yaml`, here's what happens:
1. kubectl sends an HTTP request to the API Server
2. API Server authenticates you (are you who you say you are?)
3. API Server authorizes you (are you allowed to create deployments?)
4. API Server validates the YAML (is the syntax correct?)
5. API Server stores the deployment spec in etcd
6. API Server notifies controllers about the new deployment
7. Controllers take action to make the deployment happen

```bash
# Check API server status
kubectl cluster-info

# Get API versions
kubectl api-versions

# Get API resources
kubectl api-resources
```

#### 2. etcd
**What it does:**
- Distributed key-value store
- Stores cluster state and configuration
- Highly available and consistent

**Detailed Theory:**
etcd is Kubernetes' "brain" - it's where all cluster data is stored. Think of it as a highly reliable database that keeps track of everything in your cluster.

**What etcd stores:**
- All Kubernetes objects (pods, services, deployments, etc.)
- Cluster configuration and settings
- Secrets and ConfigMaps
- Current state of all resources
- Desired state of all resources

**Why etcd is special:**
1. **Consistency**: Uses Raft consensus algorithm to ensure all nodes have the same data
2. **High Availability**: Can run in clusters (usually 3 or 5 nodes) for fault tolerance
3. **Watch API**: Other components can "watch" for changes and react immediately
4. **Atomic Operations**: Complex updates happen atomically (all or nothing)

**Real-world analogy:**
Imagine etcd as the "master ledger" of a bank. Every transaction (creating a pod, updating a service) is recorded here. All tellers (other Kubernetes components) read from this ledger to know the current state of all accounts (resources).

**Critical importance:**
If etcd goes down, your entire cluster becomes read-only. If etcd data is lost, your entire cluster configuration is gone. This is why etcd backups are crucial in production.

```bash
# Check etcd health (if accessible)
kubectl get componentstatuses
```

#### 3. Controller Manager (kube-controller-manager)
- Runs controller processes
- Node Controller, Replication Controller, etc.
- Watches for changes and maintains desired state

#### 4. Scheduler (kube-scheduler)
- Assigns pods to nodes
- Considers resource requirements, constraints, and policies

```bash
# View scheduler events
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Worker Node Components

#### 1. Kubelet
- Node agent that runs on each worker node
- Manages pod lifecycle
- Reports node status to master

```bash
# Check kubelet status (on node)
systemctl status kubelet

# View kubelet logs
journalctl -u kubelet
```

#### 2. Kube-proxy
- Network proxy running on each node
- Maintains network rules
- Implements Services concept

#### 3. Container Runtime
- Runs containers (Docker, containerd, CRI-O)
- Pulls images and manages container lifecycle

```bash
# Check container runtime
kubectl get nodes -o wide
```

### Cluster Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Master Node   │    │  Worker Node 1  │    │  Worker Node 2  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│  API Server     │    │     Kubelet     │    │     Kubelet     │
│  etcd           │◄──►│   Kube-proxy    │    │   Kube-proxy    │
│  Controller Mgr │    │Container Runtime│    │Container Runtime│
│  Scheduler      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 3. Core Concepts

### Pods

**Definition:**
The smallest deployable unit in Kubernetes. A pod can contain one or more containers that share:
- Network (IP address and port space)
- Storage volumes
- Lifecycle

**Detailed Theory:**
A Pod is like a "wrapper" around your containers. Think of it as a small virtual machine that can run one or more tightly coupled containers. Here's why pods exist:

**Why Pods, not just Containers?**
1. **Shared Resources**: Containers in a pod share the same network IP and storage volumes
2. **Atomic Scheduling**: All containers in a pod are scheduled together on the same node
3. **Inter-container Communication**: Containers can communicate via localhost
4. **Lifecycle Management**: All containers start and stop together

**Common Pod Patterns:**
1. **Single Container Pod**: Most common - one main application container
2. **Multi-container Pod**: Main container + helper containers (sidecars)
   - Web server + log collector
   - Application + monitoring agent
   - Database + backup utility

**Pod Networking:**
- Each pod gets a unique IP address within the cluster
- Containers in the pod communicate via localhost (127.0.0.1)
- Ports must be unique within the pod (can't have two containers using port 80)

**Pod Storage:**
- Volumes are shared among all containers in the pod
- Data persists during container restarts within the pod
- When pod dies, ephemeral storage is lost (unless using persistent volumes)

**Important Concepts:**
- Pods are ephemeral (temporary) - they come and go
- You rarely create pods directly - usually through Deployments
- Each pod has a unique name and IP address
- Pods are scheduled as a single unit

#### Pod Lifecycle Phases

1. **Pending**: Pod accepted but not scheduled
2. **Running**: Pod bound to node and containers created
3. **Succeeded**: All containers terminated successfully
4. **Failed**: All containers terminated with at least one failure
5. **Unknown**: Pod state cannot be determined

```bash
# Create a simple pod
kubectl run nginx --image=nginx

# Get pods
kubectl get pods
kubectl get pods -o wide
kubectl get pods --watch

# Describe pod
kubectl describe pod nginx

# Get pod logs
kubectl logs nginx
kubectl logs nginx -f  # follow logs

# Execute commands in pod
kubectl exec nginx -- ls /
kubectl exec -it nginx -- /bin/bash

# Delete pod
kubectl delete pod nginx
```

### Namespaces

Virtual clusters within a physical cluster to organize resources and provide isolation.

```bash
# List namespaces
kubectl get namespaces
kubectl get ns

# Create namespace
kubectl create namespace development
kubectl create ns production

# Set default namespace
kubectl config set-context --current --namespace=development

# Delete namespace
kubectl delete namespace development
```

### Labels and Selectors

Key-value pairs attached to objects for identification and selection.

```bash
# Add label to pod
kubectl label pods nginx app=web

# Show labels
kubectl get pods --show-labels

# Select by label
kubectl get pods -l app=web
kubectl get pods -l 'environment in (production, qa)'
kubectl get pods -l 'environment notin (development)'

# Remove label
kubectl label pods nginx app-
```

### Annotations

Non-identifying metadata attached to objects.

```bash
# Add annotation
kubectl annotate pods nginx description="Web server pod"

# View annotations
kubectl describe pod nginx
```

---

## 4. Kubernetes Objects and Resources

### 4.1 Pods

#### Basic Pod YAML

**Theory:** This YAML defines a single-container pod running nginx web server. Let's break down each section:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  namespace: default
  labels:
    app: nginx
    environment: production
  annotations:
    description: "Nginx web server"
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    ports:
    - containerPort: 80
      protocol: TCP
    env:
    - name: ENV_VAR
      value: "production"
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    volumeMounts:
    - name: html-volume
      mountPath: /usr/share/nginx/html
  volumes:
  - name: html-volume
    emptyDir: {}
  restartPolicy: Always
  nodeSelector:
    kubernetes.io/os: linux
```

**YAML Explanation:**

**Header Section:**
- `apiVersion: v1`: Tells Kubernetes this is using the core/v1 API (stable API for basic resources)
- `kind: Pod`: Specifies this is a Pod resource

**Metadata Section:**
- `name: nginx-pod`: Unique identifier for this pod within the namespace
- `namespace: default`: Which namespace to create the pod in (like a folder for organization)
- `labels`: Key-value pairs for identification and selection (used by services, deployments)
  - `app: nginx`: Identifies this as part of the nginx application
  - `environment: production`: Indicates this is for production use
- `annotations`: Additional metadata that doesn't affect functionality (for humans/tools)

**Spec Section (The Desired State):**
- `containers`: Array of containers to run in this pod

**Container Configuration:**
- `name: nginx`: Name of the container within the pod
- `image: nginx:1.21`: Docker image to use (nginx version 1.21 from Docker Hub)
- `ports`: Exposes port 80 for HTTP traffic (doesn't actually publish it, just documents it)
- `env`: Environment variables passed to the container
- `resources`: CPU and memory allocation
  - `requests`: Guaranteed resources (scheduler uses this for placement)
  - `limits`: Maximum resources the container can use
  - `cpu: "250m"`: 250 millicores (0.25 CPU cores)
  - `memory: "64Mi"`: 64 Mebibytes of RAM
- `volumeMounts`: Mounts the html-volume at the nginx web root

**Pod-level Configuration:**
- `volumes`: Defines storage volumes available to containers
  - `emptyDir: {}`: Creates temporary storage that exists for the pod's lifetime
- `restartPolicy: Always`: Restart containers if they crash
- `nodeSelector`: Ensures pod only runs on Linux nodes

#### Multi-Container Pod

**Theory:** This demonstrates the sidecar pattern - a main application container working alongside a helper container. This is useful when you need containers that are tightly coupled and need to share resources.

**Use Cases for Multi-Container Pods:**
1. **Web server + Log collector**: Main app writes logs to shared volume, sidecar ships them to centralized logging
2. **Application + Monitoring agent**: Sidecar collects metrics from main application
3. **Data processor + File watcher**: One container processes files, another watches for new files
4. **Database + Backup utility**: Main database container + sidecar that handles backups

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
spec:
  containers:
  - name: web-server
    image: nginx
    ports:
    - containerPort: 80
    volumeMounts:
    - name: shared-volume
      mountPath: /usr/share/nginx/html
  - name: content-generator
    image: busybox
    command: ["/bin/sh"]
    args: ["-c", "while true; do echo $(date) > /shared/index.html; sleep 10; done"]
    volumeMounts:
    - name: shared-volume
      mountPath: /shared
  volumes:
  - name: shared-volume
    emptyDir: {}
```

**Multi-Container YAML Explanation:**

**Container 1 - Web Server:**
- `name: web-server`: The main application container
- `image: nginx`: Standard nginx web server
- `ports: - containerPort: 80`: Exposes HTTP port
- `volumeMounts`: Mounts shared storage at nginx's web root (`/usr/share/nginx/html`)

**Container 2 - Content Generator:**
- `name: content-generator`: Helper/sidecar container
- `image: busybox`: Lightweight Linux container for simple tasks
- `command: ["/bin/sh"]`: Runs shell as the main process
- `args`: Shell script that runs in a loop:
  - `while true`: Infinite loop
  - `echo $(date) > /shared/index.html`: Writes current date/time to index.html
  - `sleep 10`: Waits 10 seconds before next update
- `volumeMounts`: Mounts same shared storage at `/shared`

**Shared Volume:**
- `name: shared-volume`: Volume name referenced by both containers
- `emptyDir: {}`: Temporary storage that exists for the pod's lifetime

**How it works together:**
1. Content generator writes HTML content to shared volume every 10 seconds
2. Nginx serves that content from the same shared volume
3. When you visit the web server, you see the current timestamp that updates every 10 seconds
4. Both containers share the same network (IP address) and storage
5. They can communicate via localhost if needed

**Real-world equivalent:**
This pattern is like having a blogger (content-generator) and a publisher (web-server) working together. The blogger writes articles to a shared folder, and the publisher immediately makes them available to readers.

### 4.2 Deployments

**Definition:**
Manages a set of identical pods and provides declarative updates.

**Detailed Theory:**
Deployments are the most common way to run applications in Kubernetes. Think of a Deployment as a "pod manager" that ensures you always have the right number of identical pods running.

**Why use Deployments instead of creating Pods directly?**
1. **Replication**: Ensures multiple copies of your app are running
2. **Self-healing**: Automatically replaces failed pods
3. **Rolling updates**: Updates your app without downtime
4. **Rollback**: Can undo updates if something goes wrong
5. **Scaling**: Easily increase or decrease the number of replicas

**Key Concepts:**
- **Replica**: A single instance of your application (one pod)
- **ReplicaSet**: The underlying mechanism that maintains the desired number of replicas
- **Rolling Update**: Gradually replaces old pods with new ones
- **Rollback**: Returns to a previous version of your application

**Deployment Lifecycle:**
1. You create a Deployment with desired state (3 replicas of nginx:1.21)
2. Deployment creates a ReplicaSet
3. ReplicaSet creates 3 Pods
4. If a Pod fails, ReplicaSet creates a new one
5. If you update the Deployment (nginx:1.22), it creates a new ReplicaSet
6. New ReplicaSet gradually creates new Pods while old ones are terminated

**Real-world analogy:**
A Deployment is like a restaurant manager who:
- Ensures there are always enough waiters (pods) working
- Replaces waiters who call in sick (failed pods)
- Trains new waiters while gradually replacing old ones (rolling updates)
- Can bring back experienced waiters if new ones aren't working out (rollbacks)

#### Deployment YAML

**Theory:** This YAML creates a production-ready deployment with 3 replicas of nginx, including health checks and resource management. Let's examine each section:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 20
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
```

**Deployment YAML Detailed Explanation:**

**API and Kind:**
- `apiVersion: apps/v1`: Uses the apps API group (for workload resources)
- `kind: Deployment`: Creates a Deployment resource

**Metadata:**
- `name: nginx-deployment`: Unique name for this deployment
- `labels: app: nginx`: Labels help organize and select resources

**Spec (Desired State):**
- `replicas: 3`: Always maintain 3 running pods
- `selector: matchLabels: app: nginx`: Tells the deployment which pods it manages

**Pod Template (`template` section):**
This defines the "blueprint" for creating pods:
- `metadata: labels: app: nginx`: All created pods get this label
- `spec`: The actual pod specification

**Container Configuration:**
- `name: nginx`: Container name within the pod
- `image: nginx:1.21`: Specific version (important for consistency)
- `ports: containerPort: 80`: Documents that the app uses port 80

**Resource Management:**
- `requests`: Guaranteed resources (used for scheduling)
  - `memory: "64Mi"`: Pod needs at least 64MB RAM
  - `cpu: "250m"`: Pod needs 0.25 CPU cores
- `limits`: Maximum resources (prevents resource starvation)
  - `memory: "128Mi"`: Pod can use max 128MB RAM
  - `cpu: "500m"`: Pod can use max 0.5 CPU cores

**Health Checks:**
- `readinessProbe`: Checks if pod is ready to receive traffic
  - `httpGet`: Performs HTTP GET request to `/` on port 80
  - `initialDelaySeconds: 5`: Wait 5 seconds after container starts
  - `periodSeconds: 10`: Check every 10 seconds
- `livenessProbe`: Checks if pod is still healthy
  - Similar HTTP check but with different timing
  - If this fails, Kubernetes restarts the container

**Update Strategy:**
- `type: RollingUpdate`: Update pods gradually, not all at once
- `maxUnavailable: 1`: At most 1 pod can be unavailable during updates
- `maxSurge: 1`: At most 1 extra pod can be created during updates

**How Rolling Updates Work:**
1. With 3 replicas and maxSurge=1, Kubernetes can create 1 extra pod (total 4)
2. With maxUnavailable=1, at least 2 pods must stay running
3. Process: Create new pod → Wait for readiness → Terminate old pod → Repeat
4. This ensures zero downtime during updates

#### Deployment Management Commands

```bash
# Create deployment
kubectl create deployment nginx --image=nginx:1.21
kubectl apply -f nginx-deployment.yaml

# Scale deployment
kubectl scale deployment nginx-deployment --replicas=5

# Update deployment
kubectl set image deployment/nginx-deployment nginx=nginx:1.22

# Rollback deployment
kubectl rollout history deployment/nginx-deployment
kubectl rollout undo deployment/nginx-deployment
kubectl rollout undo deployment/nginx-deployment --to-revision=2

# Check rollout status
kubectl rollout status deployment/nginx-deployment

# Restart deployment
kubectl rollout restart deployment/nginx-deployment
```

### 4.3 ReplicaSets

Ensures a specified number of pod replicas are running.

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx-replicaset
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
```

### 4.4 StatefulSets

**Definition:**
Manages stateful applications with persistent identity.

**Detailed Theory:**
StatefulSets are designed for applications that need persistent identity, stable network names, and ordered deployment/scaling. While Deployments treat all pods as identical and replaceable, StatefulSets give each pod a unique, persistent identity.

**When to Use StatefulSets:**
- **Databases**: MySQL, PostgreSQL, MongoDB clusters
- **Message Queues**: Apache Kafka, RabbitMQ clusters  
- **Distributed Systems**: Elasticsearch, Cassandra, Zookeeper
- **Any app requiring**: Stable hostnames, persistent storage, ordered startup

**StatefulSet vs Deployment:**
| Feature | Deployment | StatefulSet |
|---------|------------|-------------|
| Pod Identity | Random names | Predictable names (web-0, web-1, web-2) |
| Network Identity | No guarantees | Stable hostnames |
| Storage | Shared or none | Individual persistent volumes |
| Scaling | All at once | One at a time, ordered |
| Updates | Rolling, any order | Ordered (web-2, then web-1, then web-0) |
| Use Case | Stateless apps | Stateful apps |

#### Characteristics:
- **Stable, unique network identifiers**: Each pod gets predictable DNS name
- **Stable, persistent storage**: Each pod gets its own PVC that survives restarts  
- **Ordered, graceful deployment and scaling**: Pods created/deleted one by one in order
- **Ordered, automated rolling updates**: Updates happen in reverse order (highest index first)

**StatefulSet Identity:**
If you create a StatefulSet named "web" with 3 replicas, you get:
- Pods: `web-0`, `web-1`, `web-2`
- DNS: `web-0.web-service.default.svc.cluster.local`
- PVCs: `www-web-0`, `www-web-1`, `www-web-2`
- Order: Always created 0→1→2, deleted 2→1→0

**Real-world Example - Database Cluster:**
Imagine a MySQL master-slave setup:
- `mysql-0`: Master database (handles writes)
- `mysql-1`: Slave 1 (handles reads, replicates from master)
- `mysql-2`: Slave 2 (handles reads, replicates from master)

**Why order matters:**
1. Master (`mysql-0`) must start first
2. Slaves connect to master during startup
3. If master fails, slave promotion follows specific order
4. Each database needs its own persistent storage
5. Applications connect to specific instances by name

**StatefulSet Guarantees:**
- Pod `web-1` will not be deployed until `web-0` is Running and Ready
- Pod `web-1` will not be deleted until `web-2` is completely deleted
- If `web-0` fails, it will be recreated with the same name and storage
- DNS names remain stable across pod restarts

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web-statefulset
spec:
  serviceName: "web-service"
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: nginx
        ports:
        - containerPort: 80
        volumeMounts:
        - name: web-storage
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: web-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 1Gi
```

### 4.5 DaemonSets

Ensures a pod runs on every node (or selected nodes).

#### Use Cases:
- Node monitoring (Prometheus Node Exporter)
- Log collection (Fluentd, Filebeat)
- Network plugins

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd-daemonset
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluentd
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

### 4.6 Jobs and CronJobs

#### Jobs
Run pods to completion for batch processing.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-job
spec:
  completions: 3
  parallelism: 2
  backoffLimit: 4
  template:
    spec:
      containers:
      - name: worker
        image: busybox
        command: ["sh", "-c", "echo Processing item; sleep 30"]
      restartPolicy: Never
```

#### CronJobs
Schedule jobs to run periodically.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scheduled-job
spec:
  schedule: "0 2 * * *"  # Every day at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cleanup
            image: busybox
            command: ["sh", "-c", "echo Cleaning up old files; find /tmp -type f -mtime +7 -delete"]
          restartPolicy: OnFailure
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
```

---

## 5. Networking in Kubernetes

### 5.1 Services

**Definition:**
Services provide stable network endpoints for pods.

**Detailed Theory:**
Services solve a fundamental problem in Kubernetes: pods are ephemeral (they come and go), but applications need stable ways to communicate. A Service acts as a "permanent address" that routes traffic to a set of pods.

**The Problem Services Solve:**
- Pod IP addresses change when pods are recreated
- You can't hardcode pod IPs in your applications
- You need load balancing across multiple pod replicas
- External clients need a consistent way to access your application

**How Services Work:**
1. Service gets a stable IP address (ClusterIP) that never changes
2. Service uses label selectors to find target pods
3. Service maintains an internal list of pod IPs (called Endpoints)
4. When traffic comes to the Service IP, it's load-balanced to healthy pods
5. If pods die and are recreated, Service automatically updates its endpoint list

**Service Discovery:**
Kubernetes provides automatic service discovery through:
- **DNS**: Services get DNS names like `my-service.my-namespace.svc.cluster.local`
- **Environment Variables**: Pods get env vars with service addresses
- **Service IPs**: Stable IP addresses that don't change

**Load Balancing:**
Services automatically distribute traffic across all healthy pods using:
- Round-robin (default): Each request goes to the next pod in sequence
- Session affinity: Can route requests from same client to same pod

**Real-world Analogy:**
A Service is like a receptionist at a company:
- External visitors (traffic) don't need to know which employee (pod) to talk to
- Receptionist (Service) has a stable phone number (ClusterIP)
- Receptionist routes calls to available employees (load balancing)
- If an employee leaves (pod dies), receptionist updates the directory (endpoints)
- New employees (new pods) are automatically added to the directory

#### Service Types

**Overview:**
Kubernetes provides four types of Services, each serving different networking needs:

1. **ClusterIP** (Default): Internal cluster communication
2. **NodePort**: Exposes service on each node's IP
3. **LoadBalancer**: External load balancer (cloud provider)
4. **ExternalName**: Maps service to external DNS name

**Detailed Service Type Explanations:**

**1. ClusterIP (Internal Services):**
- **Purpose**: For communication between services within the cluster
- **IP Range**: Gets an IP from the cluster's internal IP range
- **Access**: Only accessible from within the cluster
- **Use Cases**: Database services, internal APIs, microservice communication
- **Example**: Frontend pods connecting to backend API pods

**2. NodePort (External Access via Node IPs):**
- **Purpose**: Exposes service on a static port on each node
- **Port Range**: 30000-32767 (configurable)
- **Access**: External clients can connect via `<NodeIP>:<NodePort>`
- **Use Cases**: Development, testing, or when you don't have a load balancer
- **Limitations**: Exposes service on all nodes, requires firewall configuration

**3. LoadBalancer (Cloud Load Balancers):**
- **Purpose**: Creates an external load balancer (AWS ALB, GCP LB, Azure LB)
- **External IP**: Cloud provider assigns a public IP
- **Access**: Internet traffic can reach your service via the external IP
- **Use Cases**: Production web applications, public APIs
- **Requirements**: Must run on a cloud provider that supports load balancers

**4. ExternalName (DNS Mapping):**
- **Purpose**: Maps a service name to an external DNS name
- **No IP**: Returns a CNAME record instead of an IP
- **Use Cases**: Accessing external databases, third-party APIs
- **Example**: Map 'database' to 'prod-db.example.com'

**Service Type Decision Tree:**
- Need external access? → NodePort or LoadBalancer
- Running in the cloud? → LoadBalancer
- Only for testing/dev? → NodePort
- Internal communication only? → ClusterIP
- Accessing external service? → ExternalName

#### ClusterIP Service

**Theory:** This creates an internal service for pod-to-pod communication within the cluster. It's the most common service type for internal microservices.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-clusterip
spec:
  type: ClusterIP
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
```

**ClusterIP YAML Explanation:**

**Basic Configuration:**
- `apiVersion: v1`: Uses core Kubernetes API for Services
- `kind: Service`: Creates a Service resource
- `name: nginx-clusterip`: Service name (used for DNS resolution)

**Service Specification:**
- `type: ClusterIP`: Creates internal-only service (default if not specified)
- `selector: app: nginx`: Finds pods with label `app=nginx` to route traffic to

**Port Configuration:**
- `port: 80`: The port the service listens on (what clients connect to)
- `targetPort: 80`: The port on the pods that traffic gets forwarded to
- `protocol: TCP`: Network protocol (TCP is default, UDP also supported)

**How it Works:**
1. Service gets assigned a cluster IP (e.g., 10.96.1.100)
2. DNS entry created: `nginx-clusterip.default.svc.cluster.local`
3. Other pods can connect to this service using:
   - Service name: `http://nginx-clusterip`
   - Full DNS: `http://nginx-clusterip.default.svc.cluster.local`
   - Cluster IP: `http://10.96.1.100`
4. Traffic is load-balanced across all pods with `app=nginx` label

**Real-world Example:**
If you have a frontend app that needs to call a backend API:
- Backend pods have label `app=api`
- Create ClusterIP service with selector `app=api`
- Frontend can call `http://api-service/users` instead of hardcoding pod IPs
- If backend pods restart and get new IPs, frontend continues working

```bash
# Create ClusterIP service
kubectl expose deployment nginx-deployment --type=ClusterIP --port=80
```

#### NodePort Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-nodeport
spec:
  type: NodePort
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
    protocol: TCP
```

```bash
# Create NodePort service
kubectl expose deployment nginx-deployment --type=NodePort --port=80 --target-port=80
```

#### LoadBalancer Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-loadbalancer
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
```

#### ExternalName Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-database
spec:
  type: ExternalName
  externalName: database.example.com
  ports:
  - port: 3306
```

#### Headless Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-headless
spec:
  clusterIP: None
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
```

### 5.2 Ingress

**Definition:**
Manages external access to services, typically HTTP/HTTPS.

**Detailed Theory:**
Ingress is Kubernetes' way of handling external HTTP/HTTPS traffic and routing it to internal services. Think of Ingress as a "smart reverse proxy" that can route traffic based on hostnames, paths, and other HTTP attributes.

**Why Ingress Instead of LoadBalancer Services?**
- **Cost**: One Ingress can handle multiple services vs. one LoadBalancer per service
- **Advanced Routing**: Path-based and host-based routing
- **SSL Termination**: Handle HTTPS certificates centrally
- **Features**: Rate limiting, authentication, URL rewriting

**Ingress Components:**
1. **Ingress Resource**: YAML that defines routing rules
2. **Ingress Controller**: Software that implements the Ingress (NGINX, Traefik, HAProxy)
3. **Ingress Class**: Specifies which controller handles the Ingress

**How Ingress Works:**
1. External traffic hits the Ingress Controller (running as pods)
2. Ingress Controller reads Ingress resources to learn routing rules
3. Based on Host header and URL path, traffic is routed to appropriate Service
4. Service then load-balances to backend pods

**Traffic Flow:**
```
Internet → DNS → LoadBalancer → Ingress Controller → Ingress Rules → Service → Pods
```

**Common Ingress Patterns:**
1. **Single Service**: Simple HTTP access to one service
2. **Path-based Routing**: `/api` goes to API service, `/web` goes to web service
3. **Host-based Routing**: `api.example.com` vs `web.example.com`
4. **TLS Termination**: Handle HTTPS certificates

**Ingress vs Service Types:**
| Feature | NodePort | LoadBalancer | Ingress |
|---------|----------|--------------|----------|
| Layer | L4 (TCP/UDP) | L4 (TCP/UDP) | L7 (HTTP/HTTPS) |
| Cost | Free | $$$ (one per service) | $ (shared) |
| SSL | Manual | Manual | Built-in |
| Routing | IP:Port only | IP:Port only | Host/Path based |
| Features | Basic | Basic | Advanced |

**Real-world Analogy:**
Ingress is like a hotel concierge:
- Guests (external traffic) come to the hotel lobby
- Concierge (Ingress Controller) reads the guest list (Ingress rules)
- Based on guest name and request, directs them to the right room/service
- Handles multiple guests with one person vs. having a dedicated person per room

#### Ingress Controller

First, you need an Ingress Controller (like NGINX, Traefik, or HAProxy):

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

#### Basic Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: basic-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-service
            port:
              number: 80
```

#### Path-Based Routing

**Theory:** Path-based routing allows you to serve different applications from different URL paths on the same domain. This is perfect for microservices architecture where you want `myapp.com/api` to go to your API service and `myapp.com/web` to go to your frontend service.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-based-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
      - path: /web
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

**Path-Based Ingress YAML Explanation:**

**Metadata and Annotations:**
- `name: path-based-ingress`: Unique name for this Ingress resource
- `kubernetes.io/ingress.class: "nginx"`: Tells NGINX Ingress Controller to handle this
- `nginx.ingress.kubernetes.io/rewrite-target: /`: Rewrites the URL path before forwarding

**Routing Rules:**
- `host: myapp.com`: All rules apply to requests with Host header "myapp.com"
- `http`: Defines HTTP routing rules

**Path Configuration:**
- `path: /api`: Matches requests starting with `/api`
- `pathType: Prefix`: Matches any URL that starts with the path
- `backend`: Where to send the traffic
  - `service: name: api-service`: Forward to the api-service Service
  - `port: number: 8080`: Forward to port 8080 on that service

**How Path-Based Routing Works:**

1. **Request**: User visits `myapp.com/api/users`
2. **DNS**: Resolves to Ingress Controller IP
3. **Ingress Controller**: Receives request, checks Host header (myapp.com)
4. **Path Matching**: URL path `/api/users` matches rule `/api` (prefix match)
5. **URL Rewriting**: `/api/users` becomes `/users` (due to rewrite-target annotation)
6. **Service Forwarding**: Request sent to `api-service:8080/users`
7. **Service Load Balancing**: api-service forwards to one of its backend pods

**PathType Options:**
- `Prefix`: Matches URL paths that start with the specified path
  - `/api` matches `/api`, `/api/users`, `/api/orders`
- `Exact`: Matches only the exact path
  - `/api` matches only `/api`, not `/api/users`
- `ImplementationSpecific`: Depends on Ingress Controller implementation

**Real-world Example:**
E-commerce site architecture:
- `mystore.com/` → Frontend service (product pages, cart)
- `mystore.com/api/` → Backend API (product data, user accounts)
- `mystore.com/admin/` → Admin dashboard service
- `mystore.com/images/` → Static file service

**Benefits:**
- Single domain for multiple services
- Easy to organize microservices
- Cost-effective (one SSL certificate, one domain)
- User-friendly URLs

#### Host-Based Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: host-based-ingress
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
  - host: web.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

#### TLS Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
spec:
  tls:
  - hosts:
    - secure.example.com
    secretName: tls-secret
  rules:
  - host: secure.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: secure-service
            port:
              number: 443
```

### 5.3 Network Policies

Control traffic flow between pods.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-frontend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

### 5.4 DNS in Kubernetes

Kubernetes provides built-in DNS resolution:

- **Services**: `<service-name>.<namespace>.svc.cluster.local`
- **Pods**: `<pod-ip>.<namespace>.pod.cluster.local`

```bash
# Test DNS resolution
kubectl run busybox --image=busybox:1.28 --rm -it --restart=Never -- nslookup kubernetes.default
```

### 5.5 Data Flow Examples

#### Ingress Data Flow

```
Internet → LoadBalancer → Ingress Controller → Ingress Rules → Service → Pods
```

1. **External Request**: User makes HTTP request to `api.example.com/users`
2. **Load Balancer**: Cloud LB forwards to Ingress Controller
3. **Ingress Controller**: NGINX pod receives request
4. **Ingress Rules**: Routes based on host/path to appropriate service
5. **Service**: ClusterIP service load balances to backend pods
6. **Pod**: Application pod processes request

```bash
# Trace request path
kubectl get ingress
kubectl describe ingress api-ingress
kubectl get svc
kubectl get endpoints
kubectl get pods -o wide
```

---

## 6. Storage in Kubernetes

### 6.1 Volumes

Provide persistent storage for containers.

#### Volume Types

1. **emptyDir**: Temporary storage that exists for pod lifetime
2. **hostPath**: Mounts a file or directory from host node
3. **configMap**: Mounts ConfigMap as files
4. **secret**: Mounts Secret as files
5. **persistentVolumeClaim**: Claims a PersistentVolume

#### emptyDir Volume

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: volume-pod
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: cache-volume
      mountPath: /cache
  volumes:
  - name: cache-volume
    emptyDir: {}
```

#### hostPath Volume

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-pod
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: host-volume
      mountPath: /host-data
  volumes:
  - name: host-volume
    hostPath:
      path: /data
      type: DirectoryOrCreate
```

### 6.2 Persistent Volumes (PV)

Cluster-wide storage resource provisioned by administrator.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /data/volumes/pv1
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - worker-node-1
```

### 6.3 Persistent Volume Claims (PVC)

Request for storage by a user.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: web-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: local-storage
```

#### Using PVC in Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pvc-pod
spec:
  containers:
  - name: web
    image: nginx
    volumeMounts:
    - name: web-storage
      mountPath: /usr/share/nginx/html
  volumes:
  - name: web-storage
    persistentVolumeClaim:
      claimName: web-pvc
```

### 6.4 Storage Classes

Define different types of storage with provisioning parameters.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  fsType: ext4
allowVolumeExpansion: true
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

#### Dynamic Provisioning

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 20Gi
```

### 6.5 Volume Snapshots

Create snapshots of persistent volumes.

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: web-snapshot
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: web-pvc
```

---

## 7. Security and RBAC

### 7.1 Role-Based Access Control (RBAC)

Controls access to Kubernetes API based on roles.

#### RBAC Components

1. **Role/ClusterRole**: Define permissions
2. **RoleBinding/ClusterRoleBinding**: Bind roles to subjects
3. **Subject**: User, Group, or ServiceAccount

#### Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "watch", "list"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

#### ClusterRole

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "watch", "list"]
- apiGroups: ["metrics.k8s.io"]
  resources: ["nodes", "pods"]
  verbs: ["get", "list"]
```

#### RoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: development
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
- kind: ServiceAccount
  name: pod-reader-sa
  namespace: development
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

#### ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-nodes
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: node-reader
  apiGroup: rbac.authorization.k8s.io
```

### 7.2 Service Accounts

Provide identity for processes running in pods.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
---
apiVersion: v1
kind: Pod
metadata:
  name: sa-pod
spec:
  serviceAccountName: my-service-account
  containers:
  - name: app
    image: nginx
```

```bash
# Create service account
kubectl create serviceaccount my-sa

# Get service account details
kubectl get serviceaccount
kubectl describe serviceaccount my-sa

# Create token for service account (K8s 1.24+)
kubectl create token my-sa
```

### 7.3 Security Contexts

Define security settings for pods and containers.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: security-context-pod
spec:
  securityContext:
    runAsUser: 1000
    runAsGroup: 2000
    fsGroup: 3000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: nginx
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      runAsNonRoot: true
      capabilities:
        drop:
        - ALL
        add:
        - NET_BIND_SERVICE
```

### 7.4 Pod Security Standards

Define security policies for pods.

#### Pod Security Policy (Deprecated)

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### 7.5 Network Policies for Security

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-netpol
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: production
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

---

## 8. Configuration Management

### 8.1 ConfigMaps

**Definition:**
Store non-confidential configuration data.

**Detailed Theory:**
ConfigMaps solve the problem of hardcoded configuration in container images. Instead of rebuilding images for different environments, you externalize configuration and inject it at runtime.

**The Problem ConfigMaps Solve:**
- Database URLs differ between dev, staging, and production
- Application settings change without code changes
- Configuration files are environment-specific
- You don't want to rebuild Docker images for config changes

**How ConfigMaps Work:**
1. Store configuration as key-value pairs in Kubernetes
2. Mount ConfigMaps as files or environment variables in pods
3. Applications read configuration at runtime
4. Update ConfigMaps without rebuilding/redeploying containers

**ConfigMap Data Types:**
1. **Literal Values**: Simple key-value pairs
   - `database_host=localhost`
   - `debug=true`
2. **Files**: Entire configuration files
   - `application.properties`
   - `nginx.conf`
3. **Directories**: Multiple files at once

**Ways to Use ConfigMaps:**
1. **Environment Variables**: Set env vars in containers
2. **Volume Mounts**: Mount as files in the filesystem
3. **Command Line Arguments**: Pass config as args to containers

**ConfigMap vs Hardcoded Config:**
| Aspect | Hardcoded | ConfigMap |
|--------|-----------|----------|
| Flexibility | Low | High |
| Image Rebuilds | Required | Not needed |
| Environment Promotion | Difficult | Easy |
| Secret Data | Visible | Use Secrets instead |
| Runtime Updates | Impossible | Possible* |

*Note: Pod restart usually required for config changes to take effect

**Real-world Analogy:**
ConfigMaps are like a restaurant's daily specials board:
- Chef (developer) creates recipes (code) that don't change
- Daily specials (configuration) change based on available ingredients (environment)
- Waiters (containers) read the specials board (ConfigMap) to tell customers
- Board can be updated without retraining waiters (no code changes)

**Best Practices:**
- Never store passwords or secrets in ConfigMaps
- Use meaningful names for keys
- Organize related config together
- Version your ConfigMaps for rollbacks
- Document what each config value does

#### Creating ConfigMaps

```bash
# From literal values
kubectl create configmap app-config --from-literal=database_url=postgres://localhost:5432/mydb --from-literal=debug=true

# From file
kubectl create configmap app-config --from-file=config.properties

# From directory
kubectl create configmap app-config --from-file=config-dir/
```

#### ConfigMap YAML

**Theory:** This ConfigMap demonstrates both simple key-value pairs and file-based configuration. It shows how you can store different types of configuration data in a single resource.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: "postgres://localhost:5432/mydb"
  debug: "true"
  config.properties: |
    database.host=localhost
    database.port=5432
    database.name=mydb
    logging.level=INFO
```

**ConfigMap YAML Detailed Explanation:**

**Basic Structure:**
- `apiVersion: v1`: Uses core Kubernetes API
- `kind: ConfigMap`: Creates a ConfigMap resource
- `name: app-config`: Name used to reference this ConfigMap

**Data Section:**
The `data` section contains all configuration as string key-value pairs:

**Simple Key-Value Pairs:**
- `database_url`: Connection string for the database
  - Note: Quotes ensure it's treated as a string
  - Could be used as environment variable: `DATABASE_URL`
- `debug`: Boolean flag converted to string
  - ConfigMaps only store strings, so `true` becomes `"true"`
  - Application needs to parse this back to boolean

**Multi-line File Content:**
- `config.properties`: A complete properties file stored as a single value
- `|` (pipe symbol): YAML syntax for multi-line string (preserves newlines)
- Contains multiple configuration lines:
  - `database.host=localhost`: Database hostname
  - `database.port=5432`: Database port
  - `database.name=mydb`: Database name
  - `logging.level=INFO`: Application log level

**How Applications Use This ConfigMap:**

**As Environment Variables:**
```yaml
env:
- name: DATABASE_URL
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: database_url
- name: DEBUG
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: debug
```

**As Volume Mount (File):**
```yaml
volumeMounts:
- name: config-volume
  mountPath: /etc/app
# This creates:
# /etc/app/database_url (contains: postgres://localhost:5432/mydb)
# /etc/app/debug (contains: true)
# /etc/app/config.properties (contains: the full properties file)
```

**Real-world Usage Patterns:**
1. **Web Application**: Store API endpoints, feature flags, UI themes
2. **Database Application**: Store connection pools, timeout values, retry counts
3. **Microservice**: Store service discovery URLs, circuit breaker settings
4. **Batch Job**: Store processing parameters, file paths, schedule settings

**Important Notes:**
- ConfigMaps are stored in etcd (not encrypted)
- Maximum size: 1MB per ConfigMap
- All values must be strings (numbers/booleans get converted)
- Changes to ConfigMaps don't automatically restart pods
- Use Secrets for sensitive data, not ConfigMaps

#### Using ConfigMaps

##### As Environment Variables

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-env-pod
spec:
  containers:
  - name: app
    image: nginx
    env:
    - name: DATABASE_URL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database_url
    envFrom:
    - configMapRef:
        name: app-config
```

##### As Volume Mounts

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-volume-pod
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      items:
      - key: config.properties
        path: app.properties
```

### 8.2 Secrets

**Definition:**
Store sensitive information like passwords, tokens, keys.

**Detailed Theory:**
Secrets are Kubernetes' way of handling sensitive data that should not be stored in container images or ConfigMaps. They provide a more secure way to store and access confidential information.

**Why Secrets Instead of ConfigMaps?**
1. **Base64 Encoding**: Data is base64 encoded (not encryption, but obscures plain text)
2. **Memory Storage**: Can be stored in tmpfs (RAM) instead of disk
3. **Access Control**: Can have different RBAC permissions than ConfigMaps
4. **Audit Logging**: Secret access can be logged separately
5. **Encryption at Rest**: Can be encrypted in etcd (cluster configuration dependent)

**Common Types of Secrets:**
1. **Database Passwords**: Connection credentials
2. **API Keys**: Third-party service authentication
3. **TLS Certificates**: SSL/HTTPS certificates and private keys
4. **Docker Registry Credentials**: For pulling private images
5. **SSH Keys**: For Git access or server authentication
6. **OAuth Tokens**: For service-to-service authentication

**Secret Security Model:**
- **Base64 Encoded**: Not encrypted by default, just encoded
- **Node-level Security**: Only sent to nodes that have pods using them
- **Memory Storage**: Can be configured to use tmpfs (RAM-only)
- **RBAC Protected**: Access controlled by Kubernetes permissions
- **Encryption at Rest**: Optional etcd encryption (configure at cluster level)

**Important Security Notes:**
⚠️ **Secrets are NOT encrypted by default - they're only base64 encoded!**
⚠️ **Anyone with API access can read secrets**
⚠️ **Secrets are visible in pod YAML when mounted**
⚠️ **Enable etcd encryption for true security at rest**

**Secret Lifecycle:**
1. Create secret with sensitive data
2. Reference secret in pod specification
3. Kubelet retrieves secret when scheduling pod
4. Secret mounted as file or environment variable
5. Application reads secret at runtime
6. Secret data stays on node until pod is deleted

**Real-world Analogy:**
Secrets are like a hotel safe:
- You don't want to carry valuables (passwords) in your pocket (container image)
- Hotel provides a secure storage (Secret)
- Only you have the combination (RBAC permissions)
- Contents are hidden from casual observers (base64 encoding)
- Hotel security systems protect access (Kubernetes API)
- But hotel staff could still access it if needed (cluster admins)

**Best Practices:**
- Rotate secrets regularly
- Use least-privilege access (RBAC)
- Enable etcd encryption at rest
- Consider external secret management (Vault, AWS Secrets Manager)
- Never log secret values
- Use specific secret types (TLS, docker-registry) when appropriate
- Monitor secret access with audit logging

#### Creating Secrets

```bash
# Generic secret
kubectl create secret generic my-secret --from-literal=username=admin --from-literal=password=secretpassword

# Docker registry secret
kubectl create secret docker-registry my-registry-secret \
  --docker-server=docker.io \
  --docker-username=myuser \
  --docker-password=mypassword \
  --docker-email=myemail@example.com

# TLS secret
kubectl create secret tls tls-secret --cert=tls.crt --key=tls.key
```

#### Secret Types

1. **Opaque**: Generic secret (default)
2. **kubernetes.io/dockerconfigjson**: Docker registry credentials
3. **kubernetes.io/tls**: TLS certificate and key
4. **kubernetes.io/service-account-token**: Service account token

#### Secret YAML

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
data:
  username: YWRtaW4=  # base64 encoded 'admin'
  password: cGFzc3dvcmQ=  # base64 encoded 'password'
stringData:
  database-url: "postgres://user:pass@localhost/db"
```

#### Using Secrets

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-pod
spec:
  containers:
  - name: app
    image: nginx
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: my-secret
          key: username
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secret
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: my-secret
  imagePullSecrets:
  - name: my-registry-secret
```

---

## 9. Workload Management

### 9.1 Resource Management

#### Resource Requests and Limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resource-pod
spec:
  containers:
  - name: app
    image: nginx
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
        ephemeral-storage: "1Gi"
      limits:
        memory: "128Mi"
        cpu: "500m"
        ephemeral-storage: "2Gi"
```

#### LimitRange

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: resource-constraints
  namespace: development
spec:
  limits:
  - default:
      memory: "512Mi"
      cpu: "500m"
    defaultRequest:
      memory: "256Mi"
      cpu: "250m"
    type: Container
  - max:
      memory: "1Gi"
      cpu: "1000m"
    min:
      memory: "128Mi"
      cpu: "100m"
    type: Container
```

#### ResourceQuota

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: namespace-quota
  namespace: development
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "4"
    pods: "10"
    services: "5"
```

### 9.2 Quality of Service (QoS)

1. **Guaranteed**: requests = limits for all resources
2. **Burstable**: requests < limits or only requests specified
3. **BestEffort**: no requests or limits specified

### 9.3 Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nginx-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

```bash
# Create HPA
kubectl autoscale deployment nginx-deployment --cpu-percent=70 --min=1 --max=10

# Get HPA status
kubectl get hpa
kubectl describe hpa nginx-hpa
```

### 9.4 Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: nginx-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx-deployment
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: nginx
      maxAllowed:
        cpu: 1
        memory: 500Mi
      minAllowed:
        cpu: 100m
        memory: 50Mi
      controlledResources: ["cpu", "memory"]
```

### 9.5 Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: nginx-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: nginx
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: nginx-pdb-percentage
spec:
  maxUnavailable: 25%
  selector:
    matchLabels:
      app: nginx
```

---

## 10. Service Mesh

### 10.1 Introduction to Service Mesh

A service mesh is a dedicated infrastructure layer for handling service-to-service communication. It provides:
- Traffic management
- Security (mTLS)
- Observability
- Policy enforcement

### 10.2 Istio Service Mesh

#### Installation

```bash
# Download Istio
curl -L https://istio.io/downloadIstio | sh -
cd istio-1.19.0
export PATH=$PWD/bin:$PATH

# Install Istio
istioctl install --set values.defaultRevision=default

# Enable sidecar injection
kubectl label namespace default istio-injection=enabled
```

#### Istio Gateway

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: bookinfo-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - bookinfo.example.com
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: bookinfo-secret
    hosts:
    - bookinfo.example.com
```

#### Virtual Service

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: bookinfo-vs
spec:
  hosts:
  - bookinfo.example.com
  gateways:
  - bookinfo-gateway
  http:
  - match:
    - uri:
        prefix: /api/v1
    route:
    - destination:
        host: reviews
        port:
          number: 9080
        subset: v1
      weight: 50
    - destination:
        host: reviews
        port:
          number: 9080
        subset: v2
      weight: 50
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: productpage
        port:
          number: 9080
```

#### Destination Rule

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reviews-dr
spec:
  host: reviews
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    connectionPool:
      tcp:
        maxConnections: 10
      http:
        http1MaxPendingRequests: 10
        maxRequestsPerConnection: 2
    circuitBreaker:
      consecutiveGatewayErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

#### Service Entry

```yaml
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-api
spec:
  hosts:
  - api.external.com
  ports:
  - number: 443
    name: https
    protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS
```

#### PeerAuthentication

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: reviews-auth
spec:
  selector:
    matchLabels:
      app: reviews
  mtls:
    mode: STRICT
  portLevelMtls:
    9080:
      mode: DISABLE
```

#### Authorization Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: productpage-authz
spec:
  selector:
    matchLabels:
      app: productpage
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/bookinfo-productpage"]
  - to:
    - operation:
        methods: ["GET", "POST"]
  - when:
    - key: source.ip
      values: ["10.0.0.0/8", "192.168.0.0/16"]
```

### 10.3 Linkerd Service Mesh

#### Installation

```bash
# Install Linkerd CLI
curl -sL https://run.linkerd.io/install | sh
export PATH=$PATH:$HOME/.linkerd2/bin

# Validate cluster
linkerd check --pre

# Install Linkerd
linkerd install | kubectl apply -f -
linkerd check

# Install Linkerd Viz extension
linkerd viz install | kubectl apply -f -
```

#### Inject Linkerd Proxy

```bash
# Inject into deployment
kubectl get deploy -o yaml | linkerd inject - | kubectl apply -f -

# Auto-injection with annotation
kubectl annotate namespace production linkerd.io/inject=enabled
```

#### Traffic Split

```yaml
apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: webapp-split
spec:
  service: webapp
  backends:
  - service: webapp-v1
    weight: 80
  - service: webapp-v2
    weight: 20
```

### 10.4 Consul Connect (Consul Service Mesh)

#### Installation with Helm

```bash
# Add Consul Helm repo
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

# Install Consul
helm install consul hashicorp/consul --set global.name=consul --set connectInject.enabled=true
```

#### Service Defaults

```yaml
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceDefaults
metadata:
  name: web
spec:
  protocol: http
  meshGateway:
    mode: local
  transparentProxy:
    outboundListenerPort: 22001
    dialedDirectly: false
```

#### Service Splitter

```yaml
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceSplitter
metadata:
  name: web
spec:
  splits:
  - weight: 80
    service: web
    serviceSubset: v1
  - weight: 20
    service: web
    serviceSubset: v2
```

### 10.5 Anthos Service Mesh (ASM)

Anthos Service Mesh is Google's managed Istio offering.

```bash
# Install ASM
curl -LO https://storage.googleapis.com/gke-release/asm/istio-1.17.8-asm.20-linux-amd64.tar.gz
tar xzf istio-1.17.8-asm.20-linux-amd64.tar.gz
./istio-1.17.8-asm.20/bin/istioctl install --set values.global.meshID=mesh1 --set values.global.network=network1
```

---

## 11. Monitoring and Observability

### 11.1 Health Checks

#### Readiness Probe

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readiness-pod
spec:
  containers:
  - name: app
    image: nginx
    readinessProbe:
      httpGet:
        path: /healthz
        port: 8080
        httpHeaders:
        - name: Custom-Header
          value: Awesome
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 3
      successThreshold: 1
      failureThreshold: 3
```

#### Liveness Probe

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: liveness-pod
spec:
  containers:
  - name: app
    image: nginx
    livenessProbe:
      tcpSocket:
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
```

#### Startup Probe

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: startup-pod
spec:
  containers:
  - name: app
    image: nginx
    startupProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 10
      periodSeconds: 5
      failureThreshold: 30
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      periodSeconds: 10
```

### 11.2 Prometheus and Grafana

#### Prometheus Installation

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack
```

#### ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: webapp-monitor
  labels:
    app: webapp
spec:
  selector:
    matchLabels:
      app: webapp
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

#### PrometheusRule

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: webapp-rules
spec:
  groups:
  - name: webapp.rules
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: High error rate detected
        description: "Error rate is {{ $value }} errors per second"
```

### 11.3 Logging

#### Centralized Logging with Fluentd

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      serviceAccount: fluentd
      serviceAccountName: fluentd
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

---

## 12. Advanced Topics

### 12.1 Custom Resources and Operators

#### Custom Resource Definition (CRD)

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: webapps.example.com
spec:
  group: example.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              replicas:
                type: integer
                minimum: 1
                maximum: 10
              image:
                type: string
          status:
            type: object
            properties:
              availableReplicas:
                type: integer
    additionalPrinterColumns:
    - name: Replicas
      type: integer
      jsonPath: .spec.replicas
    - name: Available
      type: integer
      jsonPath: .status.availableReplicas
  scope: Namespaced
  names:
    plural: webapps
    singular: webapp
    kind: WebApp
    shortNames:
    - wa
```

#### Custom Resource

```yaml
apiVersion: example.com/v1
kind: WebApp
metadata:
  name: my-webapp
spec:
  replicas: 3
  image: nginx:1.21
```

### 12.2 Admission Controllers

#### ValidatingAdmissionWebhook

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionWebhook
metadata:
  name: pod-policy-webhook
webhooks:
- name: pod-policy.example.com
  clientConfig:
    service:
      name: webhook-service
      namespace: webhook-system
      path: /validate
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  admissionReviewVersions: ["v1", "v1beta1"]
```

#### MutatingAdmissionWebhook

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingAdmissionWebhook
metadata:
  name: pod-mutator-webhook
webhooks:
- name: pod-mutator.example.com
  clientConfig:
    service:
      name: webhook-service
      namespace: webhook-system
      path: /mutate
  rules:
  - operations: ["CREATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  admissionReviewVersions: ["v1", "v1beta1"]
```

### 12.3 Pod Security Standards

#### Pod Security Policy (Deprecated in K8s 1.21+)

Modern alternative: Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: secure-namespace
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 12.4 Multi-tenancy

#### Namespace-based Tenancy

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a
  labels:
    tenant: tenant-a
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: tenant-a
  name: tenant-a-admin
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-admin-binding
  namespace: tenant-a
subjects:
- kind: User
  name: tenant-a-admin
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: tenant-a-admin
  apiGroup: rbac.authorization.k8s.io
```

### 12.5 Cluster Autoscaling

#### Cluster Autoscaler

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.21.0
        name: cluster-autoscaler
        resources:
          limits:
            cpu: 100m
            memory: 300Mi
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster
```

---

## 13. Best Practices

### 13.1 Resource Management

1. **Always set resource requests and limits**
2. **Use appropriate QoS classes**
3. **Implement resource quotas**
4. **Monitor resource usage**

### 13.2 Security Best Practices

1. **Use least privilege principle**
2. **Enable RBAC**
3. **Use security contexts**
4. **Scan container images**
5. **Enable network policies**
6. **Use secrets for sensitive data**
7. **Regular security updates**

### 13.3 Deployment Best Practices

1. **Use declarative configuration**
2. **Version control all manifests**
3. **Implement health checks**
4. **Use rolling updates**
5. **Set pod disruption budgets**
6. **Label everything consistently**

### 13.4 Monitoring Best Practices

1. **Monitor cluster health**
2. **Set up alerting**
3. **Track key metrics**
4. **Centralized logging**
5. **Regular backups**

### 13.5 YAML Best Practices

#### Well-structured Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
  namespace: production
  labels:
    app: webapp
    version: v1.2.3
    component: backend
    managed-by: helm
  annotations:
    deployment.kubernetes.io/revision: "1"
    description: "Web application backend"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: webapp
      version: v1.2.3
  template:
    metadata:
      labels:
        app: webapp
        version: v1.2.3
        component: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: webapp-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
      - name: webapp
        image: myregistry.com/webapp:v1.2.3
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: webapp-secrets
              key: database-url
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: webapp-config
              key: log-level
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        volumeMounts:
        - name: config-volume
          mountPath: /etc/config
        - name: data-volume
          mountPath: /data
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
      volumes:
      - name: config-volume
        configMap:
          name: webapp-config
      - name: data-volume
        emptyDir: {}
      imagePullSecrets:
      - name: registry-secret
      nodeSelector:
        kubernetes.io/os: linux
      tolerations:
      - key: "node-role.kubernetes.io/spot"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - webapp
              topologyKey: kubernetes.io/hostname
```

---

## 14. Troubleshooting

### 14.1 Pod Troubleshooting

```bash
# Pod stuck in Pending
kubectl describe pod <pod-name>
kubectl get events --sort-by=.metadata.creationTimestamp

# Pod crashing
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name>

# Pod stuck in Terminating
kubectl delete pod <pod-name> --force --grace-period=0

# Debug running pod
kubectl exec -it <pod-name> -- /bin/bash
kubectl exec -it <pod-name> -c <container-name> -- /bin/bash
```

### 14.2 Service Troubleshooting

```bash
# Service not accessible
kubectl get svc
kubectl describe svc <service-name>
kubectl get endpoints <service-name>

# Test service connectivity
kubectl run test-pod --image=busybox -it --rm --restart=Never -- wget -qO- <service-name>:<port>
```

### 14.3 Network Troubleshooting

```bash
# DNS resolution
kubectl run test-pod --image=busybox -it --rm --restart=Never -- nslookup kubernetes.default

# Network connectivity
kubectl run netshoot --image=nicolaka/netshoot -it --rm --restart=Never
```

### 14.4 Node Troubleshooting

```bash
# Node status
kubectl get nodes
kubectl describe node <node-name>
kubectl top nodes

# Node logs
sudo journalctl -u kubelet
sudo journalctl -u docker
```

### 14.5 Common Issues and Solutions

#### Issue: ImagePullBackOff

```bash
# Check image name and tag
kubectl describe pod <pod-name>

# Check image pull secrets
kubectl get secrets
kubectl describe secret <secret-name>
```

#### Issue: CrashLoopBackOff

```bash
# Check container logs
kubectl logs <pod-name> --previous

# Check resource limits
kubectl describe pod <pod-name>

# Check liveness/readiness probes
kubectl get pod <pod-name> -o yaml
```

#### Issue: Pending Pods

```bash
# Check resource availability
kubectl top nodes
kubectl describe pod <pod-name>

# Check node selectors and tolerations
kubectl get pod <pod-name> -o yaml
```

---

## 15. Commands Reference

### 15.1 Cluster Management

```bash
# Cluster information
kubectl cluster-info
kubectl cluster-info dump
kubectl version
kubectl api-versions
kubectl api-resources

# Node management
kubectl get nodes
kubectl get nodes -o wide
kubectl describe node <node-name>
kubectl cordon <node-name>
kubectl uncordon <node-name>
kubectl drain <node-name> --ignore-daemonsets
kubectl top nodes
```

### 15.2 Pod Management

```bash
# Pod operations
kubectl get pods
kubectl get pods -o wide
kubectl get pods --all-namespaces
kubectl get pods -l app=nginx
kubectl get pods --field-selector=status.phase=Running
kubectl get pods --sort-by=.metadata.creationTimestamp
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl logs <pod-name> -f
kubectl logs <pod-name> --previous
kubectl logs <pod-name> -c <container-name>
kubectl exec <pod-name> -- <command>
kubectl exec -it <pod-name> -- /bin/bash
kubectl port-forward <pod-name> 8080:80
kubectl cp <pod-name>:/path/to/file ./local-file
kubectl delete pod <pod-name>
kubectl delete pods --all
```

### 15.3 Deployment Management

```bash
# Deployment operations
kubectl get deployments
kubectl describe deployment <deployment-name>
kubectl create deployment nginx --image=nginx
kubectl scale deployment <deployment-name> --replicas=5
kubectl autoscale deployment <deployment-name> --min=2 --max=10 --cpu-percent=70
kubectl set image deployment/<deployment-name> <container-name>=<new-image>
kubectl rollout status deployment/<deployment-name>
kubectl rollout history deployment/<deployment-name>
kubectl rollout undo deployment/<deployment-name>
kubectl rollout restart deployment/<deployment-name>
kubectl delete deployment <deployment-name>
```

### 15.4 Service Management

```bash
# Service operations
kubectl get services
kubectl get svc
kubectl describe service <service-name>
kubectl expose deployment <deployment-name> --type=LoadBalancer --port=80
kubectl expose pod <pod-name> --port=80 --target-port=8080
kubectl delete service <service-name>
```

### 15.5 ConfigMap and Secret Management

```bash
# ConfigMap operations
kubectl get configmaps
kubectl describe configmap <configmap-name>
kubectl create configmap <name> --from-literal=<key>=<value>
kubectl create configmap <name> --from-file=<file>
kubectl get configmap <name> -o yaml
kubectl delete configmap <name>

# Secret operations
kubectl get secrets
kubectl describe secret <secret-name>
kubectl create secret generic <name> --from-literal=<key>=<value>
kubectl create secret docker-registry <name> --docker-server=<server> --docker-username=<username> --docker-password=<password>
kubectl get secret <name> -o yaml
kubectl delete secret <name>
```

### 15.6 Namespace Management

```bash
# Namespace operations
kubectl get namespaces
kubectl get ns
kubectl create namespace <namespace-name>
kubectl delete namespace <namespace-name>
kubectl config set-context --current --namespace=<namespace-name>
kubectl config view --minify | grep namespace
```

### 15.7 Resource Management

```bash
# Resource monitoring
kubectl top nodes
kubectl top pods
kubectl top pods --containers
kubectl describe quota
kubectl describe limits

# Resource creation and management
kubectl apply -f <file.yaml>
kubectl apply -f <directory>/
kubectl apply -k <kustomization-directory>
kubectl delete -f <file.yaml>
kubectl replace -f <file.yaml>
kubectl patch <resource-type> <resource-name> -p '<patch>'
```

### 15.8 Troubleshooting Commands

```bash
# Events and logs
kubectl get events
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl get events --field-selector involvedObject.name=<resource-name>
kubectl logs -l app=<app-name>

# Debug commands
kubectl run debug --image=busybox -it --rm --restart=Never -- sh
kubectl debug <pod-name> -it --image=busybox --target=<container-name>
kubectl auth can-i <verb> <resource>
kubectl auth can-i create pods --as=<user>
```

### 15.9 Advanced Commands

```bash
# JSON path queries
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'

# Custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName

# Watch resources
kubectl get pods --watch
kubectl get pods -w

# Dry run
kubectl create deployment test --image=nginx --dry-run=client -o yaml
kubectl apply -f deployment.yaml --dry-run=server

# Server-side apply
kubectl apply -f deployment.yaml --server-side
```

### 15.10 Context and Configuration

```bash
# Context management
kubectl config current-context
kubectl config get-contexts
kubectl config use-context <context-name>
kubectl config set-context <context-name> --namespace=<namespace>
kubectl config delete-context <context-name>

# Cluster configuration
kubectl config view
kubectl config set-cluster <cluster-name> --server=<server-url>
kubectl config set-credentials <user-name> --token=<token>
kubectl config set-context <context-name> --cluster=<cluster-name> --user=<user-name>
```

---

## Conclusion

This comprehensive guide covers Kubernetes from basic concepts to advanced topics. To become a Kubernetes master:

1. **Start with basics**: Understand pods, services, and deployments
2. **Practice regularly**: Use a local cluster (minikube, kind, k3s)
3. **Learn YAML**: Master writing and understanding Kubernetes manifests
4. **Understand networking**: Learn how services, ingress, and CNI work
5. **Master storage**: Understand persistent volumes and storage classes
6. **Security first**: Always implement RBAC and security contexts
7. **Monitor everything**: Set up proper observability
8. **Embrace service mesh**: For advanced microservices communication
9. **Automation**: Use operators and controllers for complex applications
10. **Stay updated**: Kubernetes evolves rapidly

### Learning Path Recommendations:

1. **Week 1-2**: Pods, Services, Deployments, Basic Commands
2. **Week 3-4**: ConfigMaps, Secrets, Persistent Storage
3. **Week 5-6**: Ingress, Networking, Security (RBAC)
4. **Week 7-8**: Advanced Workloads (StatefulSets, DaemonSets, Jobs)
5. **Week 9-10**: Monitoring, Logging, Health Checks
6. **Week 11-12**: Service Mesh (Istio/Linkerd)
7. **Week 13-14**: Custom Resources, Operators
8. **Week 15-16**: Advanced Topics, Production Best Practices

Remember: The key to mastering Kubernetes is hands-on practice. Set up your own cluster and experiment with these concepts!
