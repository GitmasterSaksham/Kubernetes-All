# Kubernetes Oracle

- kubectl version   ```to check the version```
- kubectl create -f <filename> ```Create resources in Kubernetes cluster```

	Example of deployment.yaml
`````````
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
        image: nginx:latest
        ports:
        - containerPort: 80

`````````

- kubectl create deployment <deployment-name> --image=nginx:latest --replicas=3 ```Create resources using inline configurations```

## PODS
- kubectl get pods ```to get all running pods```
- kubectl apply -f <file.yaml>  ```create or update resource```
- kubectl get pods -l app=nginx
- kubectl create namespace <name> ```Create a new namespace```
- kubectl get all --all-namespaces ```List everything```
- kubectl describe pod <pod-name>
- kubectl logs <pod-name> ```for logs of specific pod```
- kubectl logs -f <pod-name> ```to get live logs of a pod```
- kubectl exec <pod-name> -- <command> ```Execute a command on a specific pod```
- kubectl exec -it my-pod -- /bin/bash ```Open an interactive shell in the pod```

## DEPLOYMENTS
- kubectl get deployments ```Listing all the deployment in the current namespace``` 
- kubectl get deployment <depl-name> -o yaml ```Getting detailed information about a specific deployment```
- kubectl scale deployment <deployment-name> --replicas=3 ```Scale the number of replicas in a deployment, replicaset, or statefulset```

- kubectl rollout status deployment/<deployment-name> ```Manage the rollout process of a deployment in Kubernetes``` ```To check all the changes is reflected successfully```
- kubeclt set image deployment/<deployment-name> nginx=nginx:1.24.0 ```Update the deployment's image to use the new version```

## Work with services
- kubectl get services ```List all services in Cluster```
- kubectl expose deployment/<deployment-name> --name=myapp-client-service --port=80 ```Creating a ClusterIP service for a deployment```

- kubectl expose deployement/<deployment-name> --name=myapp --port=80 --target-port=80 --type=NodePort
- kubectl get nodes -o wide ```to the get the nodes```
- kubectl delete services <name> ```To delete the services```
- kubectl expose deployment/<deployment-name> --name=myapp --port=80 --target-port=80 --type=LoadBalancer ```Creating a LoadBalancer service for a deployment```

## PODS
kubectl edit pod <pod-name> ```To edit the pod configuration```

kubectl get pod <pod-name> -o yaml > my-pod.yaml ```Extract Pod definition of the existing pod in a YAML format```

kubectl edit deployment <deployment-name> ```Edit and revise the definition of deployment```

## Configuring and Debuggin
- kubectl config view ```Get the configuration of the cluster```
- kubectl config get-contexts ```Viewing the list of contexts```
- kubectl config current-context ```Viewing the current Context```
- kubectl config use-context <context-name> ```Switching to a different context```
- kubectl get events ```Retrieving events for all resources```

## Deleting Resources
- kubectl delete -f filename.yaml ```Remove a pod using the name and type listed in pod.yaml```
- kubectl delete pods, services -l [label-key]=[label-value] ```for eg kubectl delete pods -l app=nginx``` ```Remoce all pods and services with a specific label```

- kubectl delete pods --all ```Remove all pods (including uninitialized pods)```
- kubectl delete deployment <deployement-name> ```delete deployment```
- kubectl delete namespace <namespace-name> ```Delete namespace```

## Node operation
- kubectl get node ```List one or more node```
- kubectl describe nodes | grep Allocated -A 5 ```Resources allocation per node```
- kubectl get pods -o wide | grep <node-name> ```pods running on a node```

## Kubectl bash alias
alias k='kubectl' ```to set the k as a kubectl ```




# 🚀 **Kubernetes Control Plane Components (Deep Explanation)**

Control Plane = “**Dimaag** of Kubernetes Cluster”.
Iske andar woh saare components hote hain jo **cluster ko control, manage, aur monitor** karte hain.



## 1. **API Server (kube-apiserver)** 🛡️

* Ye **entry point** hai Kubernetes cluster ka.
* Har ek request (kubectl, UI, ya API call) yahi pe aati hai.
* API server REST API provide karta hai jo cluster ke sare components use karte hain.
* Ye **authentication, authorization aur validation** bhi karta hai.
* Think of it as: **“Gatekeeper + Communication Hub”**.

👉 Example:
Jab tu ```kubectl apply -f deployment.yaml``` chalata hai → woh request pehle API server ke paas jaati hai → woh validate karke etcd me store karta hai.



## 2. **etcd** 📦

* Ye ek **distributed key-value store** hai.
* Cluster ka **entire state/data** yahi save hota hai.
* Matlab: pods kitne chal rahe hain, kaunsi service banayi gayi hai, kaunse nodes healthy hain → sab **etcd me save** hota hai.
* Highly available aur consistent database hai (Raft consensus algorithm use karta hai).

👉 Example:
Agar tu cluster band karke wapas start karega, toh sabka record etcd se hi milega.



## 3. **Scheduler (kube-scheduler)** 📊

* Iska kaam: **decide karna ki kaunsa pod kis node pe chalega**.
* Jab tu pod banata hai → woh pehle “Pending” state me hota hai.
* Scheduler pod ki requirement (CPU, memory, affinity, taints/tolerations) ko match karta hai available nodes ke sath aur phir pod ko ek node assign karta hai.

👉 Example:
Agar tu ek pod banaye jo GPU maange aur cluster me sirf ek GPU node hai → scheduler us pod ko usi GPU node pe bhej dega.



## 4. **Controller Manager (kube-controller-manager)** 🤖

* Ye **controllers ka ek collection** hai jo cluster ki health aur desired state maintain karta hai.
* Controllers = loops jo continuously cluster ke state ko check karte hain aur ensure karte hain ki **actual state = desired state**.

### Important Controllers inside it:

* **Node Controller** → Check karta hai ki nodes healthy hain ya nahi.
* **Replication Controller** → Ensure karta hai ki specified number of pod replicas hamesha chal rahe ho.
* **Endpoint Controller** → Services ke endpoints update karta hai jab pods add/remove hote hain.
* **Service Account & Token Controller** → Default accounts aur API access tokens banata hai.

👉 Example:
Tu ne bola ki 3 replicas chahiye, par 1 pod crash ho gaya → Controller Manager ek naya pod launch karega.



## 5. **Cloud Controller Manager (Cloud-specific)** ☁️

* Agar cluster ek cloud provider (AWS, Oracle, Azure, GCP) pe run ho raha hai toh ye component kaam karta hai.
* Ye cloud ke APIs ke sath connect hota hai aur resources manage karta hai.

### Kaam jo ye karta hai:

* Load Balancer create/update/delete (agar service type LoadBalancer use karein).
* Nodes ke lifecycle ko cloud se sync karna.
* Cloud storage (block/file volumes) attach/detach karna.

👉 Example:
OKE me agar tu ek LoadBalancer service banata hai → Cloud Controller Manager Oracle Cloud Load Balancer automatically bana dega.



# 🧠 **Summary (yaad rakhne ka tarika)**

* **API Server** = Gatekeeper, sab entry yahi se.
* **etcd** = Cluster ka “database”.
* **Scheduler** = Decide karta hai pod kahan chalega.
* **Controller Manager** = “Doctor/Repair guy” jo ensure karta hai desired state maintained ho.
* **Cloud Controller Manager** = Cloud provider ke sath integration ka bridge.



👉 Short Trick (yaad karne ke liye):
**A.E.S.C.C = API Server, etcd, Scheduler, Controller Manager, Cloud Controller Manager**
→ Ye hi paanch dimaag ke parts hain jo cluster chala rahe hote hain.



# 🚀 **Kubernetes Control Plane Components (Deep Explanation)**

Control Plane = “**Dimaag** of Kubernetes Cluster”.
Iske andar woh saare components hote hain jo **cluster ko control, manage, aur monitor** karte hain.



## 1. **API Server (kube-apiserver)** 🛡️

* Ye **entry point** hai Kubernetes cluster ka.
* Har ek request (kubectl, UI, ya API call) yahi pe aati hai.
* API server REST API provide karta hai jo cluster ke sare components use karte hain.
* Ye **authentication, authorization aur validation** bhi karta hai.
* Think of it as: **“Gatekeeper + Communication Hub”**.

👉 Example:
Jab tu ```kubectl apply -f deployment.yaml``` chalata hai → woh request pehle API server ke paas jaati hai → woh validate karke etcd me store karta hai.



## 2. **etcd** 📦

* Ye ek **distributed key-value store** hai.
* Cluster ka **entire state/data** yahi save hota hai.
* Matlab: pods kitne chal rahe hain, kaunsi service banayi gayi hai, kaunse nodes healthy hain → sab **etcd me save** hota hai.
* Highly available aur consistent database hai (Raft consensus algorithm use karta hai).

👉 Example:
Agar tu cluster band karke wapas start karega, toh sabka record etcd se hi milega.



## 3. **Scheduler (kube-scheduler)** 📊

* Iska kaam: **decide karna ki kaunsa pod kis node pe chalega**.
* Jab tu pod banata hai → woh pehle “Pending” state me hota hai.
* Scheduler pod ki requirement (CPU, memory, affinity, taints/tolerations) ko match karta hai available nodes ke sath aur phir pod ko ek node assign karta hai.

👉 Example:
Agar tu ek pod banaye jo GPU maange aur cluster me sirf ek GPU node hai → scheduler us pod ko usi GPU node pe bhej dega.



## 4. **Controller Manager (kube-controller-manager)** 🤖

* Ye **controllers ka ek collection** hai jo cluster ki health aur desired state maintain karta hai.
* Controllers = loops jo continuously cluster ke state ko check karte hain aur ensure karte hain ki **actual state = desired state**.

### Important Controllers inside it:

* **Node Controller** → Check karta hai ki nodes healthy hain ya nahi.
* **Replication Controller** → Ensure karta hai ki specified number of pod replicas hamesha chal rahe ho.
* **Endpoint Controller** → Services ke endpoints update karta hai jab pods add/remove hote hain.
* **Service Account & Token Controller** → Default accounts aur API access tokens banata hai.

👉 Example:
Tu ne bola ki 3 replicas chahiye, par 1 pod crash ho gaya → Controller Manager ek naya pod launch karega.



## 5. **Cloud Controller Manager (Cloud-specific)** ☁️

* Agar cluster ek cloud provider (AWS, Oracle, Azure, GCP) pe run ho raha hai toh ye component kaam karta hai.
* Ye cloud ke APIs ke sath connect hota hai aur resources manage karta hai.

### Kaam jo ye karta hai:

* Load Balancer create/update/delete (agar service type LoadBalancer use karein).
* Nodes ke lifecycle ko cloud se sync karna.
* Cloud storage (block/file volumes) attach/detach karna.

👉 Example:
OKE me agar tu ek LoadBalancer service banata hai → Cloud Controller Manager Oracle Cloud Load Balancer automatically bana dega.



# 🧠 **Summary (yaad rakhne ka tarika)**

* **API Server** = Gatekeeper, sab entry yahi se.
* **etcd** = Cluster ka “database”.
* **Scheduler** = Decide karta hai pod kahan chalega.
* **Controller Manager** = “Doctor/Repair guy” jo ensure karta hai desired state maintained ho.
* **Cloud Controller Manager** = Cloud provider ke sath integration ka bridge.



👉 Short Trick (yaad karne ke liye):
**A.E.S.C.C = API Server, etcd, Scheduler, Controller Manager, Cloud Controller Manager**
→ Ye hi paanch dimaag ke parts hain jo cluster chala rahe hote hain.



Oracle Kubernetes Engine (OKE) me bhi core **Kubernetes components same hote hain**, bas unko Oracle Cloud Infrastructure (OCI) manage karta hai. Main aapko simple Hinglish me samjhata hoon:



## 🔑 **Main Components of Kubernetes in OKE**

### 1. **Cluster**

* Ye ek logical group hai jisme **control plane** (Oracle manage karta hai) aur **worker nodes** (aapke apps run hote hain) hote hain.
* OKE me aapko control plane manage nahi karna padta, Oracle khud karta hai (high availability, upgrades, patches).



### 2. **Node Pools**

* Node pool = ek group of worker nodes.
* Yaha aap **image (OS)** aur **shape (CPU+RAM)** select karte ho.
* Node pools alag-alag workloads ke liye bana sakte ho (jaise ek pool GPU ke liye, ek pool CPU-intensive ke liye).



### 3. **Worker Nodes**

* Ye wo machines hain jaha containers/pods run karte ho.
* OKE me do options hote hain:

  * **Managed Nodes:** Oracle provision karta hai based on images/shapes.
  * **Virtual Nodes:** Lightweight aur on-demand provision hote hain, Oracle infra ko abstract kar deta hai.



### 4. **Pod**

* Sabse chhota deployable unit in Kubernetes.
* Ek pod me ek ya multiple containers ho sakte hain jo ek IP aur storage share karte hain.



### 5. **Deployment**

* Declarative way to run pods.
* Ye ensure karta hai ki kitne replicas chalne chahiye aur automatically restart/replace karta hai agar koi pod fail ho jaaye.



### 6. **Service**

* Ek stable endpoint deta hai taaki pods ko access kar sakein.
* Example: ClusterIP (internal), NodePort (external port), LoadBalancer (OCI Load Balancer ke sath).



### 7. **Ingress**

* Ye incoming HTTP/HTTPS traffic ko manage karta hai.
* OKE me mostly **OCI Load Balancer** ke through integrate hota hai.



### 8. **ConfigMap & Secret**

* **ConfigMap:** Non-sensitive config store karne ke liye.
* **Secret:** Sensitive data jaise passwords, API keys ke liye.



### 9. **Persistent Volumes (PV) & Persistent Volume Claims (PVC)**

* Data storage ke liye.
* OKE me ye OCI Block Volumes, File Storage, ya Object Storage ke sath integrate hote hain.



### 10. **OCI Integrations (OKE specific)**

* **OCI Load Balancer** → Services ko external traffic dene ke liye.
* **OCI IAM** → Authentication/authorization ke liye.
* **OCI Block Volume / File Storage / Object Storage** → Persistent storage ke liye.
* **OCI Networking (VCN, Subnets, Security Lists)** → Network isolation aur connectivity ke liye.



👉 Short me:

* **Control Plane** = Oracle manage karta hai.
* **Worker Nodes & Node Pools** = Aap customize karte ho.
* **Pods, Deployments, Services, Ingress, PV/PVC** = Kubernetes ke core objects.
* **OKE extra integration** deta hai OCI Load Balancer, Storage aur IAM ke sath.


