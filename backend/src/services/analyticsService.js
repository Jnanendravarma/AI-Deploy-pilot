const { projectRepository } = require('../repositories/projectRepository');
const { deploymentRepository } = require('../repositories/deploymentRepository');
const { deploymentErrorRepository } = require('../repositories/deploymentErrorRepository');

async function getDashboardAnalytics(userId) {
  const projects = await projectRepository.listByOwner(userId, { archived: false });
  const projectIds = projects.map((p) => p._id);

  const deployments = await deploymentRepository.listByProjectIds(projectIds);
  const totalDeployments = deployments.length;
  const successful = deployments.filter((d) => d.status === 'Healthy' || d.status === 'Running').length;
  const failed = deployments.filter((d) => d.status === 'Failed').length;

  const successRate = totalDeployments ? Number(((successful / totalDeployments) * 100).toFixed(2)) : 0;
  const failureRate = totalDeployments ? Number(((failed / totalDeployments) * 100).toFixed(2)) : 0;

  const averageBuildTimeMs = totalDeployments
    ? Math.round(deployments.reduce((sum, d) => sum + (d.buildDurationMs || 0), 0) / totalDeployments)
    : 0;

  const frameworkMap = new Map();
  projects.forEach((project) => {
    const key = project.framework || 'Unknown';
    frameworkMap.set(key, (frameworkMap.get(key) || 0) + 1);
  });

  const frameworkDistribution = Array.from(frameworkMap.entries()).map(([framework, count]) => ({ framework, count }));

  const topErrorsRaw = await deploymentErrorRepository.topErrors(projectIds);
  const topErrors = topErrorsRaw.map((error) => ({ name: error._id, count: error.count }));

  // Compute average recovery time from first failure to subsequent success
  let totalRecoveryTimeMs = 0;
  let recoveryCount = 0;

  for (const project of projects) {
    const projectDeployments = deployments
      .filter((d) => d.projectId === project._id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    let firstFailTime = null;

    for (const d of projectDeployments) {
      if (d.status === 'Failed') {
        if (!firstFailTime) {
          firstFailTime = new Date(d.createdAt).getTime();
        }
      } else if (d.status === 'Healthy' || d.status === 'Running') {
        if (firstFailTime) {
          const recoveryTime = new Date(d.createdAt).getTime() - firstFailTime;
          totalRecoveryTimeMs += recoveryTime;
          recoveryCount++;
          firstFailTime = null; // Reset
        }
      }
    }
  }

  const averageRecoveryTimeMs = recoveryCount ? Math.round(totalRecoveryTimeMs / recoveryCount) : 0;

  return {
    totalDeployments,
    successRate,
    failureRate,
    averageBuildTimeMs,
    frameworkDistribution,
    topErrors,
    averageRecoveryTimeMs
  };
}

module.exports = { getDashboardAnalytics };
