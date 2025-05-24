# OSINT-Project
# OSINT Domain Scanner

## Overview
This is a full-stack OSINT (Open Source Intelligence) web application that performs passive reconnaissance on a target domain using two well-known tools: **Amass** and **theHarvester**. It enables real-time scanning, result aggregation, history tracking, and Excel export through a responsive React interface and a FastAPI backend.

### Features
-  Real-time domain scanning using WebSockets
-  Concurrent scanning via Amass & theHarvester
-  Result aggregation, deduplication (subdomains, IPs, emails, social profiles)
-  Export scan results to Excel (XLSX)
-  Persistent scan history with timestamp & source
-  Fully Dockerized (React frontend + FastAPI backend)

## Quick Start (3 Commands)
```bash
# 1. Clone the repository
git clone https://github.com/OmerLeibovich/OSINT-Project.git && cd OSINT-Project

# 2. Build the Docker images
docker compose build

# 3. Launch the stack
docker compose up
```


##  Running Tests

To run integration tests for the FastAPI backend, use:

# From the root of the project
cd backend
pytest tests/


Then open your browser at: [http://localhost:3000](http://localhost:3000)

## Folder Structure
```
OSINT-Project/
├── backend/                  # FastAPI backend
│   ├── services/             # Scan service + tool strategies
│   │   ├── amass.py
│   │   ├── theharvester.py
│   │   ├── scan_service.py
│   │   └── scan_strategies.py
│   ├── storage/              # SQLite DB logic
│   │   └── sqlite.py
│   ├── tests/                # Pytest tests
│   │   ├── test_api.py
│   │   └── test_websocket.py
│   ├── main.py               # API entrypoint
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── pages/            # Home.js, Results.js
│   │   ├── api.js           # WebSocket + API bridge
│   │   └── config.js
│   ├── Dockerfile
│   ├── package.json
│   └── .env
│
├── docker-compose.yml       # Root Docker Compose
├── .env                      # Shared env vars
└── README.md                # You are here
```

## Requirements
- Docker + Docker Compose
- Internet access for OSINT tools to query external sources

---
 See `answers.md` for:
- Suggested tests for production-readiness
- Performance tuning ideas
- Known bottlenecks in Amass/theHarvester and mitigation strategies

