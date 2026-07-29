/**
 * AIEngine.js
 * Core AI reasoning engine combining Google Gemini API with expert deterministic heuristics.
 */

const axios = require('axios');
const env = require('../config/env');
const { parseLogs } = require('./LogParser');
const { classifyError } = require('./ErrorClassifier');
const { buildDiagnosisPrompt } = require('./PromptBuilder');

async function callGemini(promptText) {
  const apiKey = env.GEMINI_KEY || process.env.GEMINI_KEY || process.env.OPENAI_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: promptText }] }]
      },
      { timeout: 8000 }
    );

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn('Gemini API call failed, using deterministic AI Doctor heuristic engine:', err.message);
  }
  return null;
}

function generateHeuristicDiagnosis({ project, deployment, logs, parsed, classification }) {
  const errText = parsed.summaryText.toLowerCase();

  // Missing Node Module
  if (parsed.missingPackageName || errText.includes('cannot find module') || errText.includes('module not found')) {
    const pkg = parsed.missingPackageName || 'required-package';
    return {
      rootCause: `Missing dependency "${pkg}" in package.json.`,
      humanExplanation: `Your application attempts to import "${pkg}", but it is not installed or listed in package.json dependencies.`,
      confidenceScore: 98,
      estimatedFixTime: '1 min',
      suggestedFixes: [
        `Run "npm install ${pkg}" to add it to package.json.`,
        'Verify that all source imports match declared dependencies.',
        'Redeploy the application.'
      ],
      autoFixable: true,
      autoFixAction: { type: 'install_dep', package: pkg }
    };
  }

  // Docker Daemon
  if (errText.includes('docker daemon') || errText.includes('econnrefused')) {
    return {
      rootCause: 'Docker daemon is unreachable on the deployment host.',
      humanExplanation: 'DeployPilot AI could not connect to Docker Desktop or the local Docker socket to build the container image.',
      confidenceScore: 97,
      estimatedFixTime: '2 mins',
      suggestedFixes: [
        'Ensure Docker Desktop is open and running on your computer.',
        'Check system permissions for named pipe /var/run/docker.sock.',
        'Click "Redeploy Now" once Docker is active.'
      ],
      autoFixable: false,
      autoFixAction: null
    };
  }

  // Missing Env Vars
  if (errText.includes('env') || errText.includes('missing environment')) {
    return {
      rootCause: 'Missing required Environment Variables.',
      humanExplanation: 'The application requires environment keys (e.g. DATABASE_URL, JWT_SECRET) that were not supplied before deploying.',
      confidenceScore: 95,
      estimatedFixTime: '2 mins',
      suggestedFixes: [
        'Navigate to Project Settings -> Environment Variables.',
        'Add the missing environment key-value pairs.',
        'Trigger a new deployment.'
      ],
      autoFixable: true,
      autoFixAction: { type: 'add_env', key: 'DATABASE_URL' }
    };
  }

  // Port Conflict EADDRINUSE
  if (errText.includes('eaddrinuse') || errText.includes('port')) {
    return {
      rootCause: 'Port Conflict (EADDRINUSE).',
      humanExplanation: 'The container or application tried to bind to a port that is already in use by another process.',
      confidenceScore: 96,
      estimatedFixTime: '1 min',
      suggestedFixes: [
        'Stop conflicting background services running on that port.',
        'Allow DeployPilot AI to assign a dynamic free port.',
        'Redeploy the application.'
      ],
      autoFixable: true,
      autoFixAction: { type: 'rebind_port' }
    };
  }

  // Default fallback
  return {
    rootCause: `Build phase failed for ${project?.framework || 'application'}.`,
    humanExplanation: 'The application failed while packaging source files or executing the build script.',
    confidenceScore: 88,
    estimatedFixTime: '3 mins',
    suggestedFixes: [
      'Verify local build executes clean using your local terminal.',
      'Check package.json scripts and tsconfig settings.',
      'Trigger a clean redeployment.'
    ],
    autoFixable: false,
    autoFixAction: null
  };
}

async function analyzeWithAI({ project, deployment, logs }) {
  const parsed = parseLogs(logs);
  const classification = classifyError(parsed.summaryText);
  const prompt = buildDiagnosisPrompt({ project, deployment, logs, parsed });

  let aiResult = await callGemini(prompt);
  if (!aiResult) {
    aiResult = generateHeuristicDiagnosis({ project, deployment, logs, parsed, classification });
  }

  return {
    errorType: classification.errorType,
    category: classification.category,
    severity: classification.severity,
    confidenceScore: aiResult.confidenceScore || 90,
    rootCause: aiResult.rootCause,
    humanExplanation: aiResult.humanExplanation,
    affectedFiles: parsed.affectedFiles,
    suggestedFixes: aiResult.suggestedFixes || [],
    estimatedFixTime: aiResult.estimatedFixTime || '2 mins',
    autoFixable: !!aiResult.autoFixable,
    autoFixAction: aiResult.autoFixAction || null
  };
}

module.exports = { analyzeWithAI, callGemini };
