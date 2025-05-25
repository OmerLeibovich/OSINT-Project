# OSINT Domain Scanner

## Overview
This is a full-stack OSINT (Open Source Intelligence) web application that performs passive reconnaissance on a target domain using two well-known tools: **Amass** and **theHarvester**. It enables real-time scanning, result aggregation, history tracking, and Excel export through a responsive React interface and a FastAPI backend.

### Features
-  Real-time domain scanning using WebSockets
-  Concurrent execution of Amass, theHarvester, and Subfinder
-  Result aggregation, deduplication (subdomains, IPs, emails, social profiles)
-  Export scan results to Excel (XLSX)
-  Persistent scan history with timestamp & source
-  Fully Dockerized (React frontend + FastAPI backend)

## Quick Start (3 Commands)
```bash
# 1. Clone the repository
git clone --recurse-submodules https://github.com/OmerLeibovich/OSINT-Project.git && cd OSINT-Project

# 2. Build the Docker images
docker compose build

# 3. Launch the stack
docker compose up
```
Then open your browser at: [http://localhost:3000](http://localhost:3000)

##  Running Tests

To run integration tests for the FastAPI backend, use:

# From the root of the project
```bash
cd backend

pytest tests/
```

## Folder Structure
```
OSINT-Project/
├── backend/                  
│   ├── services/             # Scanning tool strategies
│   │   ├── amass.py
│   │   ├── theharvester.py
│   │   ├── subfinder.py     
│   │   ├── scan_service.py
│   │   └── scan_strategies.py
│   ├── storage/              # SQLite logic
│   │   └── sqlite.py
│   ├── tests/                # Pytest-based backend tests
│   │   ├── test_api.py
│   │   └── test_websocket.py
│   ├── main.py               # FastAPI app entry
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 
│   ├── src/
│   │   ├── pages/            # Home.js, Results.js
│   │   ├── api.js           # API + WebSocket client
│   │   └── config.js
│   ├── Dockerfile
│   ├── package.json
│   └── .env
│
├── docker-compose.yml
├── .env
└── README.md
```

## Requirements
- Docker + Docker Compose
- Internet access for OSINT tools to query external sources

---
 See `answers.md` for:
- Suggested tests for production-readiness
- Performance tuning ideas
- Known bottlenecks in Amass/theHarvester and mitigation strategies

