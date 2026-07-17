# Database Schema Definitions

DeployPilot AI relies on MongoDB for workspace settings, active deployment details, and diagnostics reports.

## Collections

### 1. Users
- `name` (String) - Developer full name.
- `email` (String) - Login identity key.
- `password` (String) - Hashed password credentials.
- `role` (String) - Workspace authorization permissions.

### 2. Projects
- `name` (String) - Subdomain identity string.
- `owner` (ObjectId) - Reference to the user record.
- `framework` (String) - Selected build preset.
- `envVars` (Array) - Project environment variables key-value configurations.
- `metadata` (Mixed) - Project build command configurations and custom domains lists.

### 3. Deployments
- `projectId` (ObjectId) - Target project reference.
- `status` (String) - Pipeline execution phase (Pending, Building, Healthy, Failed).
- `steps` (Array) - Individual tasks (Clone, Detect, Build, Scaled) details.

### 4. DeploymentErrors (AI Doctor Incident Reports)
- `deploymentId` (ObjectId) - Reference to failed pipeline.
- `rootCause` (String) - Detailed error category message.
- `possibleCauses` (Array) - List of probable incident drivers.
- `suggestedFix` (String) - Autopilot sandbox diff fix recommendation.
- `confidenceScore` (Number) - Scan diagnostic accuracy percentage.
