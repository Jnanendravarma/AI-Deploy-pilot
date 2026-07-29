/**
 * SecurityAnalyzer.js
 * Scans project configurations for security vulnerabilities, exposed secrets, and unencrypted parameters.
 */

const { projectRepository } = require('../repositories/projectRepository');

async function runSecurityScan(userId, projectId) {
  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) throw new Error('Project not found or unauthorized');

  const envs = project.envVars || [];
  const findings = [];

  // Check 1: Weak JWT Secret
  const jwtSecret = envs.find((e) => e.key.toUpperCase().includes('JWT') || e.key.toUpperCase().includes('SECRET'));
  if (!jwtSecret) {
    findings.push({
      id: 'sec-1',
      title: 'Missing JWT_SECRET',
      severity: 'Critical',
      description: 'No JWT authentication secret found. Token signature verification will fail or use vulnerable defaults.',
      recommendation: 'Add a high-entropy `JWT_SECRET` key (at least 32 random characters) in environment settings.'
    });
  } else if (jwtSecret.value.length < 16) {
    findings.push({
      id: 'sec-2',
      title: 'Weak JWT Secret Length',
      severity: 'High',
      description: `JWT secret "${jwtSecret.key}" is only ${jwtSecret.value.length} characters long. Susceptible to brute-force attack.`,
      recommendation: 'Update your secret to be at least 32 cryptographically random characters.'
    });
  }

  // Check 2: Public Database URL with plain password
  const dbUrl = envs.find((e) => e.key.toUpperCase().includes('DATABASE') || e.key.toUpperCase().includes('MONGO') || e.key.toUpperCase().includes('POSTGRES'));
  if (dbUrl && dbUrl.value.includes('0.0.0.0')) {
    findings.push({
      id: 'sec-3',
      title: 'Unrestricted Database Access',
      severity: 'High',
      description: 'Database connection string references wildcard IP (0.0.0.0).',
      recommendation: 'Restrict database cluster firewall IP access list to DeployPilot edge server IPs.'
    });
  }

  // Check 3: Missing HTTPS URL
  if (project.repositoryUrl && project.repositoryUrl.startsWith('http://')) {
    findings.push({
      id: 'sec-4',
      title: 'Insecure Repository URL (HTTP)',
      severity: 'Medium',
      description: 'Repository clone URL uses unencrypted HTTP protocol.',
      recommendation: 'Use HTTPS URL (https://github.com/...) for repository cloning.'
    });
  }

  const criticalCount = findings.filter((f) => f.severity === 'Critical').length;
  const highCount = findings.filter((f) => f.severity === 'High').length;
  
  let securityScore = 100 - criticalCount * 30 - highCount * 15 - findings.length * 5;
  if (securityScore < 20) securityScore = 20;

  return {
    projectId,
    projectName: project.name,
    securityScore,
    grade: securityScore >= 90 ? 'A+' : securityScore >= 75 ? 'B' : securityScore >= 60 ? 'C' : 'F',
    totalIssues: findings.length,
    findings
  };
}

module.exports = { runSecurityScan };
