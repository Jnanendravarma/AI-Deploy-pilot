/**
 * BuildService.js
 * Manages executing local build processes or command-line compilation scripts.
 */

const { exec } = require('child_process');

async function runBuildCommand(command, cwd, onLog) {
  if (!command || !command.trim()) {
    if (onLog) onLog('No build command provided. Skipping explicit build step.');
    return { success: true };
  }

  if (onLog) onLog(`Executing build command: "${command}" in ${cwd}`);

  return new Promise((resolve, reject) => {
    const proc = exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 });

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach((line) => {
        if (line.trim() && onLog) onLog(line.trim());
      });
    });

    proc.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach((line) => {
        if (line.trim() && onLog) onLog(`[stderr] ${line.trim()}`);
      });
    });

    proc.on('close', (code) => {
      if (code === 0) {
        if (onLog) onLog(`Build completed successfully with exit code 0.`);
        resolve({ success: true });
      } else {
        const err = new Error(`Build failed with exit code ${code}`);
        if (onLog) onLog(`[error] ${err.message}`);
        reject(err);
      }
    });
  });
}

module.exports = { runBuildCommand };
