/**
 * HealthChecker.js
 * Performs automated health check pings against deployed container endpoints.
 */

const axios = require('axios');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyHealth(healthUrl, retries = 6, delayMs = 1500, onLog) {
  let healthy = false;
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sleep(delayMs);
      if (onLog) {
        onLog(`Health Check Attempt ${attempt}/${retries}: Pinging ${healthUrl}...`);
      }
      
      const res = await axios.get(healthUrl, { timeout: 3000 });
      if (res.status >= 200 && res.status < 400) {
        healthy = true;
        if (onLog) {
          onLog(`Health Check Passed! Received HTTP ${res.status} OK 🟢`);
        }
        break;
      }
    } catch (err) {
      lastError = err;
      if (onLog) {
        onLog(`Health Check Attempt ${attempt}/${retries}: ${err.message}`);
      }
    }
  }

  return {
    healthy,
    error: healthy ? null : (lastError ? lastError.message : 'Container failed to respond with 200 OK')
  };
}

module.exports = { verifyHealth };
