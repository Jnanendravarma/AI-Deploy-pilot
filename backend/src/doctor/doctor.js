function analyzeDeploymentError(message) {
  const normalized = (message || '').toLowerCase();

  const catalog = [
    {
      key: 'missing package.json',
      rootCause: 'Missing package.json',
      possibleCauses: [
        'Repository root path is incorrect',
        'Project was created manually but no package.json metadata was supplied',
        'Wrong framework preset selected'
      ],
      confidenceScore: 98,
      suggestedFix: 'Select the correct project subdirectory or add a package.json file at the root of your project.',
      documentationLink: 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json'
    },
    {
      key: 'package.json not found',
      rootCause: 'Missing package.json',
      possibleCauses: [
        'Repository root path is incorrect',
        'Project was created manually but no package.json metadata was supplied',
        'Wrong framework preset selected'
      ],
      confidenceScore: 98,
      suggestedFix: 'Select the correct project subdirectory or add a package.json file at the root of your project.',
      documentationLink: 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json'
    },
    {
      key: 'missing environment variables',
      rootCause: 'Missing Environment Variables',
      possibleCauses: [
        'Required configurations or keys are missing in the DeployPilot settings tab',
        'Environment variables are not mapped in your Dockerfile or container configuration'
      ],
      confidenceScore: 95,
      suggestedFix: 'Go to the Project Settings page, add the missing environment variables under the Env Settings section, and trigger a retry.',
      documentationLink: 'https://12factor.net/config'
    },
    {
      key: 'missing env',
      rootCause: 'Missing Environment Variables',
      possibleCauses: [
        'Required configurations or keys are missing in the DeployPilot settings tab',
        'Environment variables are not mapped in your Dockerfile or container configuration'
      ],
      confidenceScore: 95,
      suggestedFix: 'Go to the Project Settings page, add the missing environment variables under the Env Settings section, and trigger a retry.',
      documentationLink: 'https://12factor.net/config'
    },
    {
      key: 'npm run build failed',
      rootCause: 'Build Failed',
      possibleCauses: [
        'TypeScript compilation errors or linting errors causing the build script to exit with non-zero code',
        'Syntax errors in the code',
        'Webpack or Vite configuration issues'
      ],
      confidenceScore: 92,
      suggestedFix: "Review local compiler warnings, verify that the project runs and compiles successfully on your local machine using 'npm run build', and check your tsconfig.json settings.",
      documentationLink: 'https://vite.dev/guide/static-deploy.html'
    },
    {
      key: 'build command failed',
      rootCause: 'Build Failed',
      possibleCauses: [
        'TypeScript compilation errors or linting errors causing the build script to exit with non-zero code',
        'Syntax errors in the code',
        'Webpack or Vite configuration issues'
      ],
      confidenceScore: 92,
      suggestedFix: "Review local compiler warnings, verify that the project runs and compiles successfully on your local machine using 'npm run build', and check your tsconfig.json settings.",
      documentationLink: 'https://vite.dev/guide/static-deploy.html'
    },
    {
      key: 'docker daemon',
      rootCause: 'Docker Daemon Unreachable',
      possibleCauses: [
        'Docker Desktop is not running on the deployment host',
        'Insufficient permissions to access the docker named pipe or socket',
        'Docker daemon crashed'
      ],
      confidenceScore: 97,
      suggestedFix: 'Start Docker Desktop on your system and ensure that the docker pipe or socket is exposed. If deploying to a remote host, verify the DOCKER_HOST env var.',
      documentationLink: 'https://docs.docker.com/desktop/troubleshoot/overview/'
    },
    {
      key: 'cannot connect to the docker daemon',
      rootCause: 'Docker Daemon Unreachable',
      possibleCauses: [
        'Docker Desktop is not running on the deployment host',
        'Insufficient permissions to access the docker named pipe or socket',
        'Docker daemon crashed'
      ],
      confidenceScore: 97,
      suggestedFix: 'Start Docker Desktop on your system and ensure that the docker pipe or socket is exposed. If deploying to a remote host, verify the DOCKER_HOST env var.',
      documentationLink: 'https://docs.docker.com/desktop/troubleshoot/overview/'
    },
    {
      key: 'connect econnrefused',
      rootCause: 'Docker Daemon Unreachable',
      possibleCauses: [
        'Docker Desktop is not running on the deployment host',
        'Insufficient permissions to access the docker named pipe or socket',
        'Docker daemon crashed'
      ],
      confidenceScore: 97,
      suggestedFix: 'Start Docker Desktop on your system and ensure that the docker pipe or socket is exposed. If deploying to a remote host, verify the DOCKER_HOST env var.',
      documentationLink: 'https://docs.docker.com/desktop/troubleshoot/overview/'
    },
    {
      key: 'mongodb authentication',
      rootCause: 'MongoDB Authentication Failure',
      possibleCauses: [
        'Invalid database username or password in MONGODB_URI',
        "The deployment server's IP address is not whitelisted in MongoDB Atlas Network Access"
      ],
      confidenceScore: 94,
      suggestedFix: "Check your database credentials inside your environment configuration, and add 0.0.0.0/0 (or your server's public IP) in the MongoDB Atlas console.",
      documentationLink: 'https://www.mongodb.com/docs/atlas/security/ip-access-list/'
    },
    {
      key: 'auth failed',
      rootCause: 'MongoDB Authentication Failure',
      possibleCauses: [
        'Invalid database username or password in MONGODB_URI',
        "The deployment server's IP address is not whitelisted in MongoDB Atlas Network Access"
      ],
      confidenceScore: 94,
      suggestedFix: "Check your database credentials inside your environment configuration, and add 0.0.0.0/0 (or your server's public IP) in the MongoDB Atlas console.",
      documentationLink: 'https://www.mongodb.com/docs/atlas/security/ip-access-list/'
    },
    {
      key: 'port is already in use',
      rootCause: 'Port Conflict (EADDRINUSE)',
      possibleCauses: [
        'Another container or application is already running on the same host port',
        'The host port binding was not released by a stopped container'
      ],
      confidenceScore: 96,
      suggestedFix: 'Stop the conflicting container using Docker Desktop or kill the process running on that port, or change the exposed port configuration in settings.',
      documentationLink: 'https://nodejs.org/api/errors.html#errors_common_system_errors'
    },
    {
      key: 'eaddrinuse',
      rootCause: 'Port Conflict (EADDRINUSE)',
      possibleCauses: [
        'Another container or application is already running on the same host port',
        'The host port binding was not released by a stopped container'
      ],
      confidenceScore: 96,
      suggestedFix: 'Stop the conflicting container using Docker Desktop or kill the process running on that port, or change the exposed port configuration in settings.',
      documentationLink: 'https://nodejs.org/api/errors.html#errors_common_system_errors'
    },
    {
      key: 'dependency conflict',
      rootCause: 'Dependency Conflicts (ERESOLVE)',
      possibleCauses: [
        'Incompatible packages in package.json dependencies',
        'Outdated locks or npm peer dependency constraints'
      ],
      confidenceScore: 93,
      suggestedFix: 'Run npm install with --legacy-peer-deps, or resolve the incompatible dependency versions manually in your package.json.',
      documentationLink: 'https://docs.npmjs.com/cli/v10/commands/npm-install'
    },
    {
      key: 'eresolve',
      rootCause: 'Dependency Conflicts (ERESOLVE)',
      possibleCauses: [
        'Incompatible packages in package.json dependencies',
        'Outdated locks or npm peer dependency constraints'
      ],
      confidenceScore: 93,
      suggestedFix: 'Run npm install with --legacy-peer-deps, or resolve the incompatible dependency versions manually in your package.json.',
      documentationLink: 'https://docs.npmjs.com/cli/v10/commands/npm-install'
    },
    {
      key: 'cannot find module',
      rootCause: 'Missing Node Module',
      possibleCauses: [
        'Package is imported in the source code but is missing from package.json dependencies',
        'npm install did not run or was interrupted during docker build'
      ],
      confidenceScore: 91,
      suggestedFix: 'Verify that all imported packages are correctly declared under the dependencies array in package.json and that npm install completed successfully.',
      documentationLink: 'https://docs.npmjs.com/specifying-dependencies-and-devdependencies-in-a-package-json-file'
    },
    {
      key: 'module not found',
      rootCause: 'Missing Node Module',
      possibleCauses: [
        'Package is imported in the source code but is missing from package.json dependencies',
        'npm install did not run or was interrupted during docker build'
      ],
      confidenceScore: 91,
      suggestedFix: 'Verify that all imported packages are correctly declared under the dependencies array in package.json and that npm install completed successfully.',
      documentationLink: 'https://docs.npmjs.com/specifying-dependencies-and-devdependencies-in-a-package-json-file'
    },
    {
      key: 'cors error',
      rootCause: 'CORS Policy Block',
      possibleCauses: [
        "Allowed origins array on the server does not include the requesting client's origin",
        'Missing credentials support (cookies) on cross-origin requests'
      ],
      confidenceScore: 89,
      suggestedFix: 'Configure the CORS middleware to accept the frontend origin URL explicitly, and verify that credentials: true is enabled in both client and server config.',
      documentationLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'
    },
    {
      key: 'cors policy',
      rootCause: 'CORS Policy Block',
      possibleCauses: [
        "Allowed origins array on the server does not include the requesting client's origin",
        'Missing credentials support (cookies) on cross-origin requests'
      ],
      confidenceScore: 89,
      suggestedFix: 'Configure the CORS middleware to accept the frontend origin URL explicitly, and verify that credentials: true is enabled in both client and server config.',
      documentationLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'
    },
    {
      key: 'oauth error',
      rootCause: 'OAuth Configuration Mismatch',
      possibleCauses: [
        'Google/GitHub Client ID or Client Secret is missing or incorrect in .env',
        'The authorized redirect callback URI in the OAuth provider dashboard does not match OAUTH_CALLBACK_URL'
      ],
      confidenceScore: 92,
      suggestedFix: 'Double-check your credentials in your Google Console or GitHub Developer Settings and verify the redirect URI callback matches your OAUTH_CALLBACK_URL.',
      documentationLink: 'https://developers.google.com/identity/protocols/oauth2'
    },
    {
      key: 'redirect_uri_mismatch',
      rootCause: 'OAuth Configuration Mismatch',
      possibleCauses: [
        'Google/GitHub Client ID or Client Secret is missing or incorrect in .env',
        'The authorized redirect callback URI in the OAuth provider dashboard does not match OAUTH_CALLBACK_URL'
      ],
      confidenceScore: 95,
      suggestedFix: 'Verify the redirect callback URL matches the OAuth client settings on Google/GitHub Developers portal.',
      documentationLink: 'https://developers.google.com/identity/protocols/oauth2'
    },
    {
      key: 'health check failed',
      rootCause: 'Container Health Check Failure',
      possibleCauses: [
        'Container application failed to respond on the configured ping endpoint within the timeout limit',
        'Application crashed during startup due to missing runtime env vars or DB connections'
      ],
      confidenceScore: 90,
      suggestedFix: 'Check container stdout logs to verify if the application boots up successfully, and ensure that the exposed port matches the port the container is listening on.',
      documentationLink: 'https://docs.docker.com/engine/reference/builder/#healthcheck'
    },
    {
      key: 'unhealthy container',
      rootCause: 'Container Health Check Failure',
      possibleCauses: [
        'Container application failed to respond on the configured ping endpoint within the timeout limit',
        'Application crashed during startup due to missing runtime env vars or DB connections'
      ],
      confidenceScore: 90,
      suggestedFix: 'Check container stdout logs to verify if the application boots up successfully, and ensure that the exposed port matches the port the container is listening on.',
      documentationLink: 'https://docs.docker.com/engine/reference/builder/#healthcheck'
    },
    {
      key: 'container crashed',
      rootCause: 'Runtime Container Crash',
      possibleCauses: [
        'Unhandled exception during startup',
        'Node memory limit exceeded',
        'Invalid start script CMD in Dockerfile'
      ],
      confidenceScore: 91,
      suggestedFix: "Inspect container logs for stderr runtime outputs, check memory limits, and ensure your start command (e.g. 'node server.js' or 'npm run start') is correct.",
      documentationLink: 'https://docs.docker.com/engine/reference/commandline/logs/'
    },
    {
      key: 'exited with code',
      rootCause: 'Runtime Container Crash',
      possibleCauses: [
        'Unhandled exception during startup',
        'Node memory limit exceeded',
        'Invalid start script CMD in Dockerfile'
      ],
      confidenceScore: 91,
      suggestedFix: "Inspect container logs for stderr runtime outputs, check memory limits, and ensure your start command (e.g. 'node server.js' or 'npm run start') is correct.",
      documentationLink: 'https://docs.docker.com/engine/reference/commandline/logs/'
    }
  ];

  const match = catalog.find((item) => normalized.includes(item.key));

  return match || {
    rootCause: 'Build Failed',
    possibleCauses: ['Dependency conflict', 'Runtime incompatibility', 'Unhandled build exception'],
    confidenceScore: 76,
    suggestedFix: 'Inspect logs around the first failure, verify environment settings, and retry with a clean build.',
    documentationLink: 'https://docs.docker.com/get-started/'
  };
}

module.exports = { analyzeDeploymentError };
