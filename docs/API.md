# DeployPilot AI API Specifications

## Authentication Services
- `POST /api/auth/register` - Create a developer workspace.
- `POST /api/auth/login` - Authenticate credentials and acquire JWT tokens.
- `GET /api/auth/me` - Fetch details of the authenticated user.

## Project Management
- `GET /api/projects` - List workspace projects.
- `POST /api/projects` - Connect a new project manual or import from templates.
- `PATCH /api/projects/:projectId` - Synchronize environment variables, build commands, and domains.
- `DELETE /api/projects/:projectId` - Permanently archive and delete a project.

## Deployments & Telemetry
- `GET /api/deployments?projectId=...` - Retrieve deployments history list.
- `POST /api/deployments` - Queue a new build execution pipeline.
- `GET /api/deployments/:deploymentId/logs` - Fetch deployment execution telemetry logs.
- `POST /api/deployments/:deploymentId/retry` - Trigger a live deployment rebuild.
- `GET /api/deployments/:deploymentId/error` - Retrieve the AI doctor diagnosis for a build incident.
