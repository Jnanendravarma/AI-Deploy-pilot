# DeployPilot AI System Architecture

DeployPilot AI is built as a high-performance, modular deployment automation platform with self-healing capabilities.

## Architecture Diagram

```
[React + Vite Frontend]
       │ (REST APIs & Socket.IO telemetry)
       ▼
[Express Gateway / REST API / Websocket Server]
       │
       ├─► [Local Asynchronous Event Queue] (Fallback when Redis is offline)
       │         │
       │         ▼
       │   [In-Process Worker Daemon] ──► [Docker Engine API] (Builds & Orchestration)
       │
       └─► [MongoDB Database Layer] (Users, Projects, Deployments, AI Diagnoses)
```

## System Components

### 1. Ingress Control API Gateway
- **Technology**: Express framework with Passport JWT authentication.
- **Responsibility**: Authenticating developers, managing projects metadata, streaming live system telemetry logs, and exposing AI Doctor diagnosis endpoints.

### 2. Autonomous Deployment Queue & Workers
- **Technology**: Local event timers (fallback when Redis is offline).
- **Responsibility**: Clones Git repositories, builds container images, executes Docker configurations, and runs live application health checks.

### 3. AI Deployment Doctor
- **Technology**: Rule-based diagnostic classifier matching compilation output patterns.
- **Responsibility**: Detects missing keys, dependency issues, and exposes automated hotfix correction diffs.
