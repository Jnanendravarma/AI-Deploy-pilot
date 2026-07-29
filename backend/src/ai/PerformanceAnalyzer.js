/**
 * PerformanceAnalyzer.js
 * Scans deployment setups and calculates Deployment Health Score (0-100).
 */

const { projectRepository } = require('../repositories/projectRepository');
const { deploymentRepository } = require('../repositories/deploymentRepository');

async function runPerformanceScan(userId, projectId) {
  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) throw new Error('Project not found or unauthorized');

  const deployments = await deploymentRepository.listByProject(projectId, { limit: 10 });
  const latestDeployment = deployments[0] || null;

  const buildDurationMs = latestDeployment?.buildDurationMs || 3000;
  const isHealthy = latestDeployment?.status === 'Healthy';

  const recommendations = [
    {
      id: 'perf-1',
      title: 'Enable Gzip / Brotli Compression',
      impact: 'High',
      estimatedGain: 'Up to 70% smaller asset payloads',
      actionableStep: 'Add `compression` middleware in Express/Node.js or enable `gzip on;` in Nginx config.'
    },
    {
      id: 'perf-2',
      title: 'Optimize Front-End Bundle Sizes & Code Splitting',
      impact: 'High',
      estimatedGain: 'Reduce initial load time by 1.2s',
      actionableStep: 'Use dynamic imports `React.lazy()` and Vite manualChunks vendor splitting.'
    },
    {
      id: 'perf-3',
      title: 'Implement Multi-Stage Docker Caching',
      impact: 'Medium',
      estimatedGain: 'Faster rebuilds (under 10s)',
      actionableStep: 'Copy `package*.json` separately before running `npm ci` in Dockerfile.'
    }
  ];

  let healthScore = 92;
  if (!isHealthy) healthScore -= 30;
  if (buildDurationMs > 30000) healthScore -= 15;

  return {
    projectId,
    projectName: project.name,
    healthScore,
    averageBuildTimeSec: Math.round(buildDurationMs / 1000),
    recommendations
  };
}

module.exports = { runPerformanceScan };
