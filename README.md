# 🚚 Real-Time Fleet Tracking System (MERN + AWS + OSRM)

A full-stack real-time fleet tracking dashboard that visualizes live vehicle locations, routes, speed, and ETA using modern web technologies and geospatial routing.

---

## 🌟 Features

- 📍 **Real-Time Vehicle Tracking**
  - Live location updates using WebSockets (Socket.IO)

- 🗺️ **Interactive Map (Leaflet + OpenStreetMap)**
  - Displays vehicles on a dynamic map
  - Click vehicle → zoom to location

- 🛣️ **Route Visualization**
  - Real road-based routing using OSRM (Open Source Routing Machine)
  - Eliminates unrealistic paths (e.g., rivers, off-road)

- ⚡ **Live Speed Tracking**
  - Calculates realistic vehicle speed using coordinate differences

- ⏱️ **ETA Calculation**
  - Estimated time of arrival based on speed and route distance

- 📊 **Fleet Dashboard UI**
  - Modern dark-themed UI with real-time updates

---

## 🏗️ Tech Stack

### Frontend
- React (Vite)
- Leaflet.js (Maps)
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB (Mongoose)

### Routing Engine
- OSRM (Docker-based routing server)

### DevOps / Tools
- Docker & Docker Compose
- REST APIs
- WebSockets

---

## ☁️ AWS Integration (Planned / Extendable)

- 🚀 EC2 → Deploy backend & OSRM server
- 🗄️ MongoDB Atlas → Cloud database
- 📡 API Gateway → Manage APIs
- ⚡ Lambda → Process location data (serverless)
- ☁️ S3 → Store logs / analytics data

- <img width="1913" height="905" alt="Screenshot 2026-08-20 225911" src="https://github.com/user-attachments/assets/44f7946c-9452-4dae-ab70-6947a99848b3" />


---

## 📁 Project Structure
