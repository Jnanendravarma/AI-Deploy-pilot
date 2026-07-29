/**
 * PromptBuilder.js
 * Builds contextualized AI prompts for Gemini / OpenAI diagnostic inference.
 */

function buildDiagnosisPrompt({ project, deployment, logs, parsed }) {
  return `You are DeployPilot AI Doctor, an expert cloud infrastructure and deployment diagnostic AI.
Analyze the following project deployment failure and output a structured JSON response.

PROJECT METADATA:
- Name: ${project?.name || 'Unknown'}
- Framework: ${project?.framework || 'Unknown'}
- Language: ${project?.language || 'Unknown'}
- Environment Variables Configured: ${JSON.stringify((project?.envVars || []).map((e) => e.key))}

DEPLOYMENT FAILURE CONTEXT:
- Deployment Status: ${deployment?.status || 'Failed'}
- Image Tag: ${deployment?.imageTag || 'N/A'}
- Error Summary: ${parsed.summaryText || 'Deployment aborted during build phase'}

LOG HIGHLIGHTS:
${parsed.errorLines.slice(0, 15).join('\n')}

INSTRUCTIONS:
Provide a JSON object with EXACTLY the following keys:
{
  "rootCause": "Short 1-sentence technical root cause",
  "humanExplanation": "Simple 2-3 sentence non-technical explanation for developers",
  "confidenceScore": 95,
  "estimatedFixTime": "2 mins",
  "suggestedFixes": ["Step 1", "Step 2", "Step 3"],
  "autoFixable": true,
  "autoFixAction": { "type": "install_dep", "target": "package_name" }
}
`;
}

function buildChatPrompt({ question, contextHistory = [], project = null, deployment = null, logs = [] }) {
  return `You are DeployPilot AI Assistant, an expert DevOps and Web Application Engineer.
Help the user resolve deployment, Docker, database, and cloud setup questions.

Context:
Project Name: ${project?.name || 'Current Project'}
Framework: ${project?.framework || 'Web App'}
Deployment Status: ${deployment?.status || 'Unknown'}

User Question: ${question}

Provide a clear, helpful, concise response with code snippets where appropriate.`;
}

module.exports = { buildDiagnosisPrompt, buildChatPrompt };
