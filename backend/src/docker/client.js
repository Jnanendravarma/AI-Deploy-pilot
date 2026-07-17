const Docker = require('dockerode');

let docker;

function getDockerClient() {
  if (!docker) {
    docker = new Docker();
  }
  return docker;
}

async function pingDocker() {
  try {
    const client = getDockerClient();
    await client.ping();
    return true;
  } catch (_error) {
    return false;
  }
}

module.exports = { getDockerClient, pingDocker };
