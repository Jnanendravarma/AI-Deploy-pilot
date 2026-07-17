# Contributing to DeployPilot AI

We welcome contributions from system architects, backend developers, and UX designers.

## Getting Started

1. Clone the repository and initialize the project:
   ```bash
   npm run install:all
   ```
2. Configure settings inside `backend/.env` (MongoDB URI, JWT secret keys, etc.).
3. Fire up the local development servers:
   ```bash
   # Terminal 1: Run frontend dev server
   npm run dev:frontend
   
   # Terminal 2: Run backend Node server
   npm run dev:backend
   ```

## Development Guidelines

- **Architecture Rules**: Maintain separation between route controllers, validators, and service layers.
- **Typings**: Ensure all React page edits are fully type-safe. Run `npx tsc --noEmit` to verify prior to pull requests.
- **Database Rules**: All schema updates should have validator hooks inside Mongoose definitions.
