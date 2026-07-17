const { Worker } = require('bullmq');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const axios = require('axios');
const { getRedis, isRedisMocked } = require('../config/redis');
const { deploymentRepository } = require('../repositories/deploymentRepository');
const { projectRepository } = require('../repositories/projectRepository');
const deploymentService = require('../services/deploymentService');
const { getDockerClient, pingDocker } = require('../docker/client');
const { generateDockerfile } = require('../dockerGenerator/dockerfileGenerator');
const { logger } = require('../utils/logger');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch (_) {
    return false;
  }
}

async function runStep(deployment, index, status, detail) {
  if (deployment.steps && deployment.steps[index]) {
    deployment.steps[index].status = status;
    if (!deployment.steps[index].startedAt) {
      deployment.steps[index].startedAt = new Date();
    }
    deployment.steps[index].detail = detail;
    if (status === 'Healthy' || status === 'Failed' || status === 'Warning') {
      deployment.steps[index].finishedAt = new Date();
    }
    await deployment.save();
  }
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

function getInternalPort(framework) {
  switch (framework) {
    case 'Vite':
    case 'React':
      return 4173;
    case 'FastAPI':
      return 8000;
    default:
      return 3000;
  }
}

async function writeBoilerplate(buildDir, framework) {
  await fs.promises.mkdir(buildDir, { recursive: true });

  if (framework === 'Next.js') {
    await fs.promises.writeFile(path.join(buildDir, 'package.json'), JSON.stringify({
      name: 'nextjs-app',
      version: '1.0.0',
      scripts: {
        "build": "next build",
        "start": "next start"
      },
      dependencies: {
        "next": "^14.2.3",
        "react": "^18.3.1",
        "react-dom": "^18.3.1"
      }
    }, null, 2));

    await fs.promises.mkdir(path.join(buildDir, 'pages'), { recursive: true });
    await fs.promises.writeFile(path.join(buildDir, 'pages/index.js'), `
      export default function Home() {
        return (
          <div style={{ fontFamily: 'sans-serif', padding: 40, textAlign: 'center', background: '#0f172a', color: '#fff', minHeight: '100vh' }}>
            <h1 style={{ color: '#6366f1' }}>DeployPilot AI - Next.js</h1>
            <p>Your app has been built and deployed in a real container!</p>
            <div style={{ marginTop: 20, padding: 15, border: '1px solid #334155', borderRadius: 8, display: 'inline-block' }}>
              Status: <strong>Healthy 🟢</strong>
            </div>
          </div>
        );
      }
    `);
  } else if (framework === 'Vite' || framework === 'React') {
    await fs.promises.writeFile(path.join(buildDir, 'package.json'), JSON.stringify({
      name: 'vite-app',
      version: '1.0.0',
      scripts: {
        "build": "vite build",
        "preview": "vite preview --host 0.0.0.0"
      },
      dependencies: {
        "react": "^18.3.1",
        "react-dom": "^18.3.1"
      },
      devDependencies: {
        "vite": "^5.2.11"
      }
    }, null, 2));

    await fs.promises.writeFile(path.join(buildDir, 'index.html'), `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>DeployPilot AI - Vite</title>
        <style>
          body { font-family: sans-serif; background: #0f172a; color: #fff; text-align: center; padding-top: 50px; }
          h1 { color: #6366f1; }
        </style>
      </head>
      <body>
        <h1>DeployPilot AI - React/Vite</h1>
        <p>Deployment running in a real Docker container!</p>
      </body>
      </html>
    `);
  } else {
    await fs.promises.writeFile(path.join(buildDir, 'package.json'), JSON.stringify({
      name: 'express-app',
      version: '1.0.0',
      main: 'server.js',
      scripts: {
        "start": "node server.js"
      },
      dependencies: {
        "express": "^4.19.2"
      }
    }, null, 2));

    await fs.promises.writeFile(path.join(buildDir, 'server.js'), `
      const express = require('express');
      const app = express();
      const port = process.env.PORT || 3000;
      app.get('/', (req, res) => {
        res.send(\`
          <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #fff; min-height: 100vh;">
            <h1 style="color: #6366f1;">DeployPilot AI - Express Server</h1>
            <p>The backend container is running live!</p>
          </div>
        \`);
      });
      app.listen(port, () => console.log('Server listening on port ' + port));
    `);
  }
}

async function executePipeline(deploymentId) {
  const startedAt = Date.now();
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new Error('Deployment not found');
  }

  const project = await projectRepository.findById(deployment.projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const buildDir = path.join(__dirname, `../../temp_builds/${deploymentId}`);
  const tarPath = path.join(os.tmpdir(), `build-${deploymentId}.tar`);

  try {
    // ----------------------------------------------------
    // STEP 0: VALIDATION
    // ----------------------------------------------------
    await deploymentService.updateDeploymentStatus(deploymentId, 'Building', 'Validation started');
    await runStep(deployment, 0, 'Building', 'Validating project metadata');
    await deploymentService.appendLog(deployment, 'info', 'Validation: checking project metadata and config settings.');

    if (!project.framework || project.framework === 'Unknown') {
      throw new Error('Framework detection failed: Framework is undefined or Unknown.');
    }

    await sleep(200);
    await runStep(deployment, 0, 'Healthy', 'Validation successful');

    // ----------------------------------------------------
    // STEP 1: DEPENDENCY CHECK
    // ----------------------------------------------------
    await runStep(deployment, 1, 'Building', 'Checking dependencies');
    await deploymentService.appendLog(deployment, 'info', `Dependency Check: scanning directories for ${project.framework}.`);

    const sourceDir = path.join(__dirname, `../../projects_source/${project._id}`);
    if (await exists(sourceDir)) {
      await fs.promises.mkdir(buildDir, { recursive: true });
      await fs.promises.cp(sourceDir, buildDir, { recursive: true });
      await deploymentService.appendLog(deployment, 'info', 'Copied project source files from repository store.');
    } else {
      await deploymentService.appendLog(deployment, 'info', 'No existing repository found. Generating frame boilerplate...');
      await writeBoilerplate(buildDir, project.framework);
    }

    const dockerfileContent = generateDockerfile(project.framework);
    await fs.promises.writeFile(path.join(buildDir, 'Dockerfile'), dockerfileContent);

    if (['Next.js', 'Vite', 'React', 'Express', 'Node'].includes(project.framework)) {
      const packageJsonExists = await exists(path.join(buildDir, 'package.json'));
      if (!packageJsonExists) {
        throw new Error('Missing package.json file. Node environments require a package.json.');
      }
    }

    await sleep(200);
    await runStep(deployment, 1, 'Healthy', 'Dependency check successful');

    // ----------------------------------------------------
    // STEP 2: DOCKER BUILD
    // ----------------------------------------------------
    await runStep(deployment, 2, 'Building', 'Building Docker image');
    await deploymentService.appendLog(deployment, 'info', 'Docker Build: checking connection to Docker daemon...');

    const dockerReady = await pingDocker();
    if (!dockerReady) {
      throw new Error('Docker daemon is unreachable. Cannot execute docker build. Ensure Docker Desktop is running.');
    }

    await deploymentService.appendLog(deployment, 'info', `Docker Build: packaging build context for image ${deployment.imageTag}`);

    await new Promise((resolve, reject) => {
      exec(`tar -cf "${tarPath}" -C "${buildDir}" .`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const docker = getDockerClient();
    await deploymentService.appendLog(deployment, 'info', 'Docker Build: compiling and installing dependencies inside container...');

    await new Promise((resolve, reject) => {
      docker.buildImage(fs.createReadStream(tarPath), { t: deployment.imageTag }, (err, stream) => {
        if (err) return reject(err);

        docker.modem.followProgress(stream, onFinished, onProgress);

        function onFinished(err, output) {
          if (err) reject(err);
          else resolve(output);
        }

        function onProgress(event) {
          if (event.stream) {
            const line = event.stream.trim();
            if (line) {
              deploymentService.appendLog(deployment, 'info', line).catch(() => {});
            }
          } else if (event.error) {
            reject(new Error(event.error));
          }
        }
      });
    });

    await runStep(deployment, 2, 'Healthy', 'Docker image built successfully');

    // ----------------------------------------------------
    // STEP 3: CONTAINER START
    // ----------------------------------------------------
    await runStep(deployment, 3, 'Running', 'Starting container');
    await deploymentService.appendLog(deployment, 'info', 'Container Start: preparing container configurations...');

    const internalPort = getInternalPort(project.framework);
    const externalPort = await findFreePort();
    const envStrings = (project.envVars || []).map((ev) => `${ev.key}=${ev.value}`);

    const container = await docker.createContainer({
      Image: deployment.imageTag,
      name: `deploypilot-${deploymentId}`,
      ExposedPorts: {
        [`${internalPort}/tcp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${internalPort}/tcp`]: [{ HostPort: String(externalPort) }]
        }
      },
      Env: envStrings
    });

    await container.start();
    deployment.containerId = container.id;
    deployment.healthUrl = `http://localhost:${externalPort}`;
    await deployment.save();

    await deploymentService.appendLog(deployment, 'info', `Container Start: container running on http://localhost:${externalPort}`);
    await runStep(deployment, 3, 'Healthy', 'Container started');

    // ----------------------------------------------------
    // STEP 4: HEALTH CHECK
    // ----------------------------------------------------
    await runStep(deployment, 4, 'Running', 'Performing health check');
    await deploymentService.appendLog(deployment, 'info', `Health Check: pinging container endpoint http://127.0.0.1:${externalPort}...`);

    let healthy = false;
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        await sleep(1500);
        const res = await axios.get(`http://127.0.0.1:${externalPort}`, { timeout: 2000 });
        if (res.status >= 200 && res.status < 400) {
          healthy = true;
          break;
        }
      } catch (err) {
        await deploymentService.appendLog(deployment, 'warn', `Health Check Attempt ${attempt}/6: endpoint not responding yet...`);
      }
    }

    if (!healthy) {
      throw new Error(`Health Check Failures: Container started on port ${externalPort} but failed to respond with 200 OK.`);
    }

    await deploymentService.appendLog(deployment, 'info', 'Health Check: responded successfully! Status: Healthy 🟢');
    await runStep(deployment, 4, 'Healthy', 'Health check passed');

    // ----------------------------------------------------
    // STEP 5: DEPLOYMENT COMPLETE
    // ----------------------------------------------------
    await runStep(deployment, 5, 'Healthy', 'Deployment complete');
    deployment.buildDurationMs = Date.now() - startedAt;
    deployment.status = 'Healthy';
    await deployment.save();

    await deploymentService.updateDeploymentStatus(deploymentId, 'Healthy', 'Deployment completed successfully');

  } catch (error) {
    logger.error('Deployment execution failed', { deploymentId, error: error.message });

    if (deployment.steps) {
      const activeIdx = deployment.steps.findIndex((s) => s.status === 'Building' || s.status === 'Running' || s.status === 'Pending');
      if (activeIdx !== -1) {
        await runStep(deployment, activeIdx, 'Failed', error.message);
      }
    }

    await deploymentService.failDeployment(deploymentId, error.message);

    if (deployment.containerId) {
      try {
        const docker = getDockerClient();
        const container = docker.getContainer(deployment.containerId);
        await container.stop();
        await container.remove();
      } catch (_) {}
    }
  } finally {
    try {
      await fs.promises.rm(buildDir, { recursive: true, force: true });
      await fs.promises.rm(tarPath, { force: true });
    } catch (_) {}
  }
}

function startDeploymentWorkers() {
  if (isRedisMocked()) {
    logger.info('Skipping BullMQ Worker initialization (Redis is in mock mode)');
    return;
  }

  const worker = new Worker('deployment-jobs', async (job) => {
    await executePipeline(job.data.deploymentId);
  }, {
    connection: getRedis(),
    concurrency: 2
  });

  worker.on('completed', (job) => {
    logger.info('Deployment job completed', { jobId: job.id, deploymentId: job.data.deploymentId });
  });

  worker.on('failed', (job, error) => {
    logger.error('Deployment job failed', { jobId: job?.id, deploymentId: job?.data?.deploymentId, error: error.message });
  });
}

module.exports = { startDeploymentWorkers, executePipeline };
