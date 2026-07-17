# Autonomous Deployment Flow

This document details the lifecycle of a DeployPilot AI deployment from code push to dynamic edge scaling.

```
[Start Deploy] 
      │
      ▼
[Phase 1: Clone] ──► Extracts ZIP or Clones Git branch
      │
      ▼
[Phase 2: Detect] ──► Checks source files (package.json) to match framework preset
      │
      ▼
[Phase 3: Dockerfile] ──► Generates custom multi-stage Dockerfile
      │
      ▼
[Phase 4: Build] ──► Spawns Docker build (or mock container stream if offline)
      │
      ├─► [On Success] ──► Spawns Container ──► Performs HTTP Health Check ──► [Healthy]
      │
      └─► [On Failure] ──► Spawns AI Diagnostics Doctor ──► Saves Incident Diagnosis
```
