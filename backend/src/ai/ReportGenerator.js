/**
 * ReportGenerator.js
 * Generates formatted deployment audit reports for downloading as PDF/Markdown.
 */

const { projectRepository } = require('../repositories/projectRepository');
const { deploymentRepository } = require('../repositories/deploymentRepository');
const { getDiagnosisByDeployment } = require('./DiagnosisService');
const { runSecurityScan } = require('./SecurityAnalyzer');
const { runPerformanceScan } = require('./PerformanceAnalyzer');

async function generateDeploymentReport(userId, projectId, deploymentId) {
  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) throw new Error('Project not found');

  const deployment = deploymentId
    ? await deploymentRepository.findById(deploymentId)
    : (await deploymentRepository.listByProject(projectId, { limit: 1 }))[0];

  const diagnosis = deployment ? await getDiagnosisByDeployment(userId, deployment._id ? deployment._id.toString() : deployment.id) : null;
  const security = await runSecurityScan(userId, projectId);
  const performance = await runPerformanceScan(userId, projectId);

  const reportMarkdown = `# DeployPilot AI — Deployment Health Report

**Project Name:** ${project.name}
**Framework:** ${project.framework || 'N/A'}
**Deployment Status:** ${deployment?.status || 'N/A'}
**Health Score:** ${performance.healthScore} / 100
**Security Grade:** ${security.grade} (${security.securityScore}/100)

---

## 1. AI Failure Diagnosis
- **Root Cause:** ${diagnosis?.rootCause || 'No active failures recorded.'}
- **Human Explanation:** ${diagnosis?.humanExplanation || 'All build steps completed without errors.'}
- **Confidence Score:** ${diagnosis?.confidenceScore || 100}%
- **Estimated Fix Time:** ${diagnosis?.estimatedFixTime || '0 mins'}

### Suggested Fixes
${(diagnosis?.suggestedFixes || []).map((fix) => `- ${fix}`).join('\n')}

---

## 2. Security Vulnerabilities
- Total Issues: ${security.totalIssues}
${security.findings.map((f) => `- [${f.severity}] ${f.title}: ${f.description}`).join('\n')}

---

## 3. Performance Optimization Advisor
- Average Build Duration: ${performance.averageBuildTimeSec}s
${performance.recommendations.map((r) => `- [${r.impact}] ${r.title}: ${r.actionableStep}`).join('\n')}

---
*Report generated automatically by DeployPilot AI Doctor.*
`;

  return {
    projectId,
    deploymentId: deployment ? (deployment._id ? deployment._id.toString() : deployment.id) : null,
    reportMarkdown,
    healthScore: performance.healthScore,
    securityGrade: security.grade,
    generatedAt: new Date()
  };
}

module.exports = { generateDeploymentReport };
