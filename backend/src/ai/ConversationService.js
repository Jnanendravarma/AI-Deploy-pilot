/**
 * ConversationService.js
 * Handles AI Chat Assistant messages and thread context.
 */

const { buildChatPrompt } = require('./PromptBuilder');
const { callGemini } = require('./AIEngine');
const { projectRepository } = require('../repositories/projectRepository');
const { deploymentRepository } = require('../repositories/deploymentRepository');
const { getSupabaseClient } = require('../config/supabase');
const { mapObjToSnake, mapRowToCamel } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const conversationsMap = new Map();

async function chatWithAI(userId, { question, projectId, deploymentId, history = [] }) {
  let project = null;
  let deployment = null;

  if (projectId) {
    try {
      project = await projectRepository.findByIdAndOwner(projectId, userId);
    } catch (_) {}
  }

  if (deploymentId) {
    try {
      deployment = await deploymentRepository.findById(deploymentId);
    } catch (_) {}
  }

  const prompt = buildChatPrompt({ question, contextHistory: history, project, deployment });

  let answerText = await callGemini(prompt);
  if (typeof answerText === 'object' && answerText !== null) {
    answerText = JSON.stringify(answerText, null, 2);
  }

  if (!answerText) {
    // Fallback heuristic responses for common questions
    const qLower = question.toLowerCase();
    if (qLower.includes('eaddrinuse') || qLower.includes('port')) {
      answerText = `**Port Conflict (EADDRINUSE)** occurs when your application tries to listen on a host port (e.g. 3000 or 8000) that is already bound by another container or process.\n\n**Fix steps:**\n1. Stop active containers: \`docker stop <container-id>\`\n2. Or let DeployPilot AI auto-assign dynamic free ports during deployment.`;
    } else if (qLower.includes('why did my deployment fail') || qLower.includes('fail')) {
      answerText = `Your deployment for **${project?.name || 'project'}** stopped during the pipeline execution.\n\n**Top Checkpoints:**\n- Check missing packages in \`package.json\`\n- Ensure Docker Desktop is active if running locally\n- Verify environment variables (e.g. \`DATABASE_URL\`) are provided in settings.`;
    } else if (qLower.includes('docker') || qLower.includes('container')) {
      answerText = `Docker builds wrap your code into isolated container images using a multi-stage Dockerfile.\n\nIf you see a Docker error, verify that Docker Desktop is running and that your build commands compile cleanly locally.`;
    } else {
      answerText = `I analyzed your project context (**${project?.name || 'DeployPilot Workspace'}**).\n\nTo ensure clean deployments, verify that all dependencies are declared in \`package.json\` or \`requirements.txt\`, environment variables are populated, and Docker Desktop is accessible.`;
    }
  }

  const updatedMessages = [
    ...history,
    { sender: 'user', text: question, timestamp: new Date() },
    { sender: 'ai', text: String(answerText), timestamp: new Date() }
  ];

  const convId = `${userId}_${projectId || 'global'}`;
  conversationsMap.set(convId, updatedMessages);

  return {
    conversationId: convId,
    answer: String(answerText),
    messages: updatedMessages
  };
}

module.exports = { chatWithAI };
