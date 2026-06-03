# 🚀 FinFlow Full-Stack Deployment Guide

This guide outlines all available options for deploying the FinFlow React frontend and Spring Boot microservices backend, categorized by cost, resource limits, and setup complexity.

---

## 📋 Summary Matrix of Deployment Options

| Option | Frontend Host | Backend Host | Database/Broker Host | Cost | Best Fit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Hybrid Tunnel (Rec.)** | Vercel | Local Laptop | Local Laptop | **100% Free** | Viva / Demos / Evaluations |
| **2. Oracle Free Cloud** | Vercel | Oracle Cloud VM | Oracle Cloud VM | **100% Free** | 24/7 Live Cloud Demo |
| **3. Render Blueprint** | Render Static | Render Services | Managed Free Cloud | **Limited Free / Paid** | Easy cloud config setup |
| **4. Railway Stack** | Railway Static | Railway Containers | Railway Databases | **Paid ($5 free initial)** | Fast click-to-deploy |
| **5. AWS / Azure VM** | Vercel | AWS EC2 (4GB RAM) | Managed Cloud | **Paid (~$20/mo)** | Real Production App |

---

## ⚡ Option 1: Vercel Frontend + Ngrok Local Tunnel (100% Free)
**Ideal for presentations, evaluations, and quick testing.**

### How it Works:
- **Frontend** is deployed on Vercel's global edge network (Free).
- **Backend microservices & databases** run locally on your laptop (utilizing your local RAM).
- **Ngrok** (a free tunnel service) exposes your local API Gateway port `8080` to a public HTTPS address.
- The Vercel frontend is configured to call this Ngrok public URL.

### Step-by-Step Setup:
1. **Deploy Frontend on Vercel**:
   - Log into [Vercel](https://vercel.com/) using your GitHub account.
   - Click **Add New Project** and select your `FinFlow` repository.
   - In the settings:
     - Set **Root Directory** to `finflow-frontend`.
     - Set **Framework Preset** to `Vite`.
2. **Start Backend Locally**:
   - Double-click `./START_ALL.bat` to run the local microservices.
3. **Start the Tunnel**:
   - Download and install [Ngrok](https://ngrok.com/).
   - Open a terminal and run:
     ```bash
     ngrok http 8080
     ```
   - Copy the generated `Forwarding` HTTPS URL (e.g. `https://1234-abcd.ngrok-free.app`).
4. **Configure Vercel Environment Variables**:
   - In your Vercel Dashboard under **Project Settings -> Environment Variables**, add:
     - Key: `VITE_API_BASE_URL`
     - Value: `https://1234-abcd.ngrok-free.app/api` (make sure to append `/api` to your Ngrok URL).
   - Re-deploy the frontend.

---

## ☁️ Option 2: Vercel Frontend + Oracle Cloud Ampere A1 (100% Free Forever)
**Ideal for permanent cloud hosting without spending money.**

Oracle Cloud Infrastructure (OCI) offers a generous **Always Free Tier** that includes 4 ARM CPUs and 24 GB of RAM, which is more than enough to run the entire FinFlow stack permanently.

### Step-by-Step Setup:
1. **Create an OCI Account**:
   - Sign up for a free account at [Oracle Cloud](https://www.oracle.com/cloud/free/).
2. **Launch a VM Instance**:
   - Create a compute instance using the **Ampere (A1) VM** shape.
   - Configure it with **4 OCPUs** and **24 GB RAM**, running **Ubuntu**.
3. **Configure Network Security List**:
   - Open ports `8080` (API Gateway) and `8761` (Eureka Dashboard) in your OCI Security List.
4. **Install Docker and Run Compose**:
   - SSH into your Ubuntu VM and install Docker:
     ```bash
     sudo apt-get update && sudo apt-get install docker.io docker-compose -y
     ```
   - Clone your repository onto the VM.
   - Build backend JARs:
     ```bash
     cd finflow-backend
     # Install Maven & JDK 17 if not present, then run:
     mvn clean package -DskipTests
     ```
   - Spin up the entire backend stack using Docker Compose:
     ```bash
     docker-compose up -d
     ```
5. **Connect Vercel**:
   - Deploy your frontend on Vercel.
   - Set the environment variable `VITE_API_BASE_URL` to `http://<YOUR_VM_PUBLIC_IP>:8080/api`.

---

## 🎨 Option 3: Render Blueprint Deploy (`render.yaml`)
**Ideal if you want to deploy the code fully on Render.**

Render allows deploying static sites and web services directly, but the **Free Tier is limited to 1 active web service**. To run all 8 microservices, you will need to upgrade to Render's paid tier.

### Managed Free Database Hosting to save memory:
- **MySQL**: Host for free on [Clever Cloud](https://www.clever-cloud.com/) or [Aiven](https://aiven.io/).
- **Redis**: Host for free on [Upstash](https://upstash.com/).
- **RabbitMQ**: Host for free on [CloudAMQP](https://www.cloudamqp.com/).

### Setup:
1. Create a `render.yaml` file in the root of your project specifying the static site and microservices build directories.
2. In Render, select **Blueprints** -> **New Blueprint Instance** and link your repo.
3. Supply the database, Redis, and RabbitMQ environment connection strings.

---

## 🚂 Option 4: Railway Monorepo Deployment
**Ideal for extremely easy, fast container setups.**

Railway is a developer-friendly platform that charges based on actual resource consumption.
- **Resource limit**: Gives new accounts $5 of free credit.
- **How to deploy**:
  - Connect your GitHub repo.
  - Railway will detect the subdirectories.
  - Create services for `api-gateway`, `auth-service`, `application-service`, etc.
  - Pin the environment variables `SPRING_DATASOURCE_URL`, `SPRING_REDIS_HOST`, and `SPRING_RABBITMQ_HOST` across the services.
- **Limitation**: Running 8 microservices plus databases will consume the $5 free tier in a few days. After that, you must enter a credit card to keep hosting.
