/**
 * DockerService.js
 * Interfaces with Docker daemon via dockerode for building image tarballs,
 * starting/stopping containers, and dynamic port binding.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const { getDockerClient, pingDocker } = require('../docker/client');

async function isDockerAvailable() {
  return pingDocker();
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function createTarBall(sourceDir, deploymentId) {
  const tarPath = path.join(os.tmpdir(), `build-${deploymentId}.tar`);
  return new Promise((resolve, reject) => {
    exec(`tar -cf "${tarPath}" -C "${sourceDir}" .`, (error) => {
      if (error) reject(error);
      else resolve(tarPath);
    });
  });
}

async function buildDockerImage(tarPath, imageTag, onLog) {
  const docker = getDockerClient();
  return new Promise((resolve, reject) => {
    docker.buildImage(fs.createReadStream(tarPath), { t: imageTag }, (err, stream) => {
      if (err) return reject(err);

      docker.modem.followProgress(stream, onFinished, onProgress);

      function onFinished(err, output) {
        if (err) reject(err);
        else resolve(output);
      }

      function onProgress(event) {
        if (event.stream && onLog) {
          const line = event.stream.trim();
          if (line) onLog(line);
        } else if (event.error) {
          reject(new Error(event.error));
        }
      }
    });
  });
}

async function startContainer({ imageTag, deploymentId, envVars = [], internalPort = 3000 }) {
  const docker = getDockerClient();
  const externalPort = await findFreePort();
  const envStrings = envVars.map((ev) => `${ev.key}=${ev.value}`);

  const container = await docker.createContainer({
    Image: imageTag,
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
  return {
    containerId: container.id,
    externalPort,
    healthUrl: `http://localhost:${externalPort}`
  };
}

async function stopAndRemoveContainer(containerId) {
  if (!containerId) return;
  try {
    const docker = getDockerClient();
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
  } catch (_) {}
}

module.exports = {
  isDockerAvailable,
  findFreePort,
  createTarBall,
  buildDockerImage,
  startContainer,
  stopAndRemoveContainer
};
