/**
 * DeploymentEngine.js
 * The core 8-step pipeline orchestrator for DeployPilot AI.
 * 
 * Timeline Steps:
 * 1. Queued
 * 2. Initializing
 * 3. Downloading
 * 4. Installing
 * 5. Building
 * 6. Starting
 * 7. Health Check
 * 8. Completed
 */

const fs = require('fs');
const path = require('path');
const { deploymentRepository } = require('../repositories/deploymentRepository');
const { projectRepository } = require('../repositories/projectRepository');
const { appendDeploymentLog } = require('./Logger');
const { sendStatus } = require('./SocketEmitter');
const { downloadRepository } = require('./RepositoryDownloader');
const { detectFramework } = require('./FrameworkDetector');
const { generateDockerfile } = require('./DockerGenerator');
const {
  isDockerAvailable,
  createTarBall,
  buildDockerImage,
  startContainer,
  stopAndRemoveContainer
} = require('./DockerService');
const { verifyHealth } = require('./HealthChecker');

const TIMELINE_STEPS = [
  'Queued',
  'Initializing',
  'Downloading',
  'Installing',
  'Building',
  'Starting',
  'Health Check',
  'Completed'
];

function initializeSteps() {
  return TIMELINE_STEPS.map((name) => ({
    name,
    status: name === 'Queued' ? 'Building' : 'Pending',
    startedAt: name === 'Queued' ? new Date() : null,
    finishedAt: null,
    detail: ''
  }));
}

async function updateStepStatus(deployment, stepIndex, status, detail = '') {
  if (!deployment.steps || !deployment.steps[stepIndex]) {
    deployment.steps = initializeSteps();
  }

  deployment.steps[stepIndex].status = status;
  deployment.steps[stepIndex].detail = detail;

  if (status === 'Building' || status === 'Running') {
    deployment.steps[stepIndex].startedAt = new Date();
  } else if (status === 'Healthy' || status === 'Failed' || status === 'Warning') {
    deployment.steps[stepIndex].finishedAt = new Date();
  }

  await deployment.save();
  sendStatus(deployment._id ? deployment._id.toString() : deployment.id, {
    status: deployment.status,
    steps: deployment.steps
  });
}

async function executePipeline(deploymentId) {
  const startTime = Date.now();
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) throw new Error('Deployment not found');

  const project = await projectRepository.findById(deployment.projectId);
  if (!project) throw new Error('Project not found');

  const buildDir = path.join(__dirname, `../../temp_builds/${deploymentId}`);
  let tarPath = null;

  const log = async (level, msg) => {
    await appendDeploymentLog(deployment, level, msg);
  };

  try {
    // ----------------------------------------------------
    // STEP 1: QUEUED -> INITIALIZING
    // ----------------------------------------------------
    await updateStepStatus(deployment, 0, 'Healthy', 'Queued successfully');
    await updateStepStatus(deployment, 1, 'Building', 'Initializing build environment');
    await log('info', '🚀 Initializing deployment pipeline...');

    deployment.status = 'Running';
    await deployment.save();

    // ----------------------------------------------------
    // STEP 2: DOWNLOADING CODE
    // ----------------------------------------------------
    await updateStepStatus(deployment, 1, 'Healthy', 'Environment initialized');
    await updateStepStatus(deployment, 2, 'Building', 'Downloading source code');
    await log('info', '📥 Downloading source code...');

    const sourceDir = path.join(__dirname, `../../projects_source/${project._id || project.id}`);
    const sourceExists = fs.existsSync(sourceDir);

    await fs.promises.mkdir(buildDir, { recursive: true });

    if (sourceExists) {
      await fs.promises.cp(sourceDir, buildDir, { recursive: true });
      await log('info', '✓ Source code loaded from project workspace store.');
    } else if (project.repositoryUrl) {
      await downloadRepository(project.repositoryUrl, deployment.branch || project.defaultBranch || 'main', buildDir);
      await log('info', `✓ GitHub repository cloned: ${project.repositoryUrl}`);
    } else {
      await log('info', 'No existing code found. Writing framework boilerplate template...');
      await fs.promises.writeFile(path.join(buildDir, 'index.html'), `<h1>Deployed via DeployPilot AI</h1>`);
    }

    await updateStepStatus(deployment, 2, 'Healthy', 'Source downloaded');

    // ----------------------------------------------------
    // STEP 3: INSTALLING & FRAMEWORK DETECTION
    // ----------------------------------------------------
    await updateStepStatus(deployment, 3, 'Building', 'Detecting framework & checking dependencies');
    await log('info', '🔍 Analyzing project structure and framework dependencies...');

    const fileNames = await fs.promises.readdir(buildDir);
    let packageJson = {};
    if (fileNames.includes('package.json')) {
      try {
        packageJson = JSON.parse(await fs.promises.readFile(path.join(buildDir, 'package.json'), 'utf8'));
      } catch (_) {}
    }

    const detection = detectFramework(fileNames, packageJson);
    await log('info', `✓ Detected Framework: ${detection.framework} (${detection.language})`);

    // Ensure Dockerfile exists or generate one dynamically
    const dockerfilePath = path.join(buildDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      const generatedDockerfile = generateDockerfile(detection.framework, {
        buildCommand: project.metadata?.buildCommand,
        startCommand: project.metadata?.startCommand
      });
      await fs.promises.writeFile(dockerfilePath, generatedDockerfile);
      await log('info', `✓ Generated optimized multi-stage Dockerfile for ${detection.framework}`);
    }

    await updateStepStatus(deployment, 3, 'Healthy', 'Framework & dependencies validated');

    // ----------------------------------------------------
    // STEP 4: BUILDING DOCKER IMAGE
    // ----------------------------------------------------
    await updateStepStatus(deployment, 4, 'Building', 'Building Docker container image');
    await log('info', '🐳 Building Docker image with container daemon...');

    const dockerReady = await isDockerAvailable();
    if (!dockerReady) {
      throw new Error('Docker daemon is unreachable. Please ensure Docker Desktop is running.');
    }

    tarPath = await createTarBall(buildDir, deploymentId);
    await buildDockerImage(tarPath, deployment.imageTag, (line) => log('info', line));
    await log('info', `✓ Docker image built successfully: ${deployment.imageTag}`);

    await updateStepStatus(deployment, 4, 'Healthy', 'Docker image built');

    // ----------------------------------------------------
    // STEP 5: STARTING CONTAINER
    // ----------------------------------------------------
    await updateStepStatus(deployment, 5, 'Building', 'Starting container instance');
    await log('info', '⚡ Launching container instance...');

    const internalPort = detection.defaultPort || 3000;
    const containerResult = await startContainer({
      imageTag: deployment.imageTag,
      deploymentId,
      envVars: project.envVars || [],
      internalPort
    });

    deployment.containerId = containerResult.containerId;
    deployment.healthUrl = containerResult.healthUrl;
    await deployment.save();

    await log('info', `✓ Container live on ${containerResult.healthUrl}`);
    await updateStepStatus(deployment, 5, 'Healthy', 'Container running');

    // ----------------------------------------------------
    // STEP 6: HEALTH CHECK
    // ----------------------------------------------------
    await updateStepStatus(deployment, 6, 'Building', 'Executing health check pings');
    await log('info', `🩺 Pinging endpoint ${containerResult.healthUrl}...`);

    const healthResult = await verifyHealth(containerResult.healthUrl, 6, 1500, (msg) => log('info', msg));

    if (!healthResult.healthy) {
      throw new Error(`Health Check Failed: ${healthResult.error}`);
    }

    await updateStepStatus(deployment, 6, 'Healthy', 'Health check passed');

    // ----------------------------------------------------
    // STEP 7: COMPLETED
    // ----------------------------------------------------
    await updateStepStatus(deployment, 7, 'Healthy', 'Deployment complete');

    deployment.status = 'Healthy';
    deployment.buildDurationMs = Date.now() - startTime;
    await deployment.save();

    await log('info', `🎉 Deployment #${deployment._id || deployment.id} completed successfully in ${Math.round(deployment.buildDurationMs / 1000)}s!`);
    sendStatus(deployment._id ? deployment._id.toString() : deployment.id, { status: 'Healthy' });

    return deployment;

  } catch (error) {
    await log('error', `❌ Pipeline Error: ${error.message}`);
    deployment.status = 'Failed';
    await deployment.save();

    // Mark current active step as failed
    if (deployment.steps) {
      const activeIdx = deployment.steps.findIndex((s) => s.status === 'Building' || s.status === 'Running');
      if (activeIdx !== -1) {
        await updateStepStatus(deployment, activeIdx, 'Failed', error.message);
      }
    }

    sendStatus(deployment._id ? deployment._id.toString() : deployment.id, { status: 'Failed', error: error.message });

    if (deployment.containerId) {
      await stopAndRemoveContainer(deployment.containerId);
    }

    throw error;

  } finally {
    try {
      if (fs.existsSync(buildDir)) await fs.promises.rm(buildDir, { recursive: true, force: true });
      if (tarPath && fs.existsSync(tarPath)) await fs.promises.rm(tarPath, { force: true });
    } catch (_) {}
  }
}

module.exports = { executePipeline, TIMELINE_STEPS };
