# Node.js + MongoDB on Kubernetes (kind)

This project demonstrates a **production‑style Node.js application with MongoDB running on Kubernetes** using **kind (Kubernetes in Docker)**.

It covers:

* Dockerized Node.js application
* MongoDB with persistent storage (PVC)
* Kubernetes Deployments & Services
* Horizontal Pod Autoscaling (HPA)
* Local Kubernetes cluster using kind

---

## 📁 Project Structure

```
my-node-app/
├── Dockerfile
├── package.json
├── package-lock.json
├── index.js              # Main Node.js application
├── public/               # UI files (HTML/CSS/JS)
├── node_modules/         # Local dependencies (not used in container)
├── k8s/
│   ├── kind-config.yaml
│   ├── mongo-pvc.yaml
│   ├── mongo-deployment.yaml
│   ├── node-deployment.yaml
│   └── node-app-hpa.yaml
└── README.md
```

---

## 🐳 Docker Image (Node.js App)

**Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

Build & push image:

```bash
docker build -t sakshamji/my-node-app:latest .
docker push sakshamji/my-node-app:latest
```

---

## ☸️ Kubernetes Setup

### 1️⃣ Create kind cluster

```bash
kind create cluster --config k8s/kind-config.yaml
```

Verify:

```bash
kubectl get nodes
```

---

## 🗄️ MongoDB (Stateful Component)

### Persistent Volume Claim

```bash
kubectl apply -f k8s/mongo-pvc.yaml
```

### MongoDB Deployment & Service

```bash
kubectl apply -f k8s/mongo-deployment.yaml
```

MongoDB runs as:

* 1 pod
* ClusterIP service: `mongo-service`
* Persistent storage at `/data/db`

---

## 🚀 Node.js Application

### Deployment & Service

```bash
kubectl apply -f k8s/node-deployment.yaml
```

Key points:

* Uses `MONGO_URL=mongodb://mongo-service:27017/mydatabase`
* Exposed via NodePort `3000`
* CPU & memory requests/limits defined (required for HPA)

Access app:

```bash
http://localhost:3000
```

---

## 📈 Horizontal Pod Autoscaler (HPA)

```bash
kubectl apply -f k8s/node-app-hpa.yaml
```

Autoscaling configuration:

* Min replicas: 1
* Max replicas: 5
* CPU utilization target: 15%

Verify:

```bash
kubectl get hpa
kubectl describe hpa node-app-hpa
```

---

## 📊 Metrics Server (Required for HPA)

Install metrics-server:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

For **kind / kubeadm**, edit metrics-server:

```bash
kubectl -n kube-system edit deployment metrics-server
```

Add:

```yaml
- --kubelet-insecure-tls
```

Restart:

```bash
kubectl rollout restart deployment metrics-server -n kube-system
```

Verify:

```bash
kubectl top nodes
kubectl top pods
```

---

## 🔥 Load Testing & Autoscaling Demo

Run a load generator inside the cluster:

```bash
kubectl run load-test --rm -it --image=busybox -- sh
```

Generate load:

```sh
while true; do wget -qO- http://node-app-service:3000/cpu >/dev/null; done
```

Watch scaling:

```bash
kubectl get pods -w
kubectl get hpa -w
```

---

## 🛠️ What This Project Demonstrates

* ✅ Containerization with Docker
* ✅ Service discovery using Kubernetes DNS
* ✅ Persistent storage for MongoDB
* ✅ Horizontal scaling using HPA
* ✅ Self-healing (pod restart & rescheduling)
* ✅ Production‑style Kubernetes patterns

---

## 🎯 Next Improvements (Optional)

* Add Ingress + TLS
* Add Prometheus & Grafana
* Convert manifests to Helm
* CI/CD pipeline (GitHub Actions / GitLab)
* NetworkPolicies & PodDisruptionBudgets

---

## 🧠 Author

**Saksham Verma**
DevOps Engineer | Kubernetes | AWS | CI/CD

---

⭐ If this repo helped you understand Kubernetes practically, give it a star!
