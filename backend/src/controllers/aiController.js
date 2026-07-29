const { asyncHandler } = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { diagnoseDeployment, getDiagnosisByDeployment, getHistoryForProject } = require('../ai/DiagnosisService');
const { chatWithAI } = require('../ai/ConversationService');
const { applyAutoFix } = require('../ai/FixEngine');
const { listKnowledgeBase } = require('../ai/KnowledgeBase');
const { getRecommendationsForProject } = require('../ai/RecommendationService');
const { runSecurityScan } = require('../ai/SecurityAnalyzer');
const { runPerformanceScan } = require('../ai/PerformanceAnalyzer');
const { generateDeploymentReport } = require('../ai/ReportGenerator');

const analyzeDeployment = asyncHandler(async (req, res) => {
  const { deploymentId } = req.body;
  const diagnosis = await diagnoseDeployment(req.user.userId, deploymentId);
  return sendSuccess(res, diagnosis, 'AI diagnosis completed', 201);
});

const getDiagnosis = asyncHandler(async (req, res) => {
  const { deploymentId } = req.params;
  const diagnosis = await getDiagnosisByDeployment(req.user.userId, deploymentId);
  return sendSuccess(res, diagnosis, 'AI diagnosis fetched');
});

const handleChat = asyncHandler(async (req, res) => {
  const result = await chatWithAI(req.user.userId, req.body);
  return sendSuccess(res, result, 'AI response generated');
});

const executeFix = asyncHandler(async (req, res) => {
  const result = await applyAutoFix(req.user.userId, req.body);
  return sendSuccess(res, result, 'Auto-fix executed', 201);
});

const getKnowledgeBase = asyncHandler(async (req, res) => {
  const list = await listKnowledgeBase(req.query.q);
  return sendSuccess(res, list, 'Knowledge base fetched');
});

const getRecommendations = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const recommendations = getRecommendationsForProject({ id: projectId });
  return sendSuccess(res, recommendations, 'Recommendations fetched');
});

const getSecurityScan = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const scan = await runSecurityScan(req.user.userId, projectId);
  return sendSuccess(res, scan, 'Security scan completed');
});

const getPerformanceScan = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const scan = await runPerformanceScan(req.user.userId, projectId);
  return sendSuccess(res, scan, 'Performance scan completed');
});

const getReport = asyncHandler(async (req, res) => {
  const { projectId, deploymentId } = req.query;
  const report = await generateDeploymentReport(req.user.userId, projectId, deploymentId);
  return sendSuccess(res, report, 'Deployment report generated');
});

const submitFeedback = asyncHandler(async (req, res) => {
  return sendSuccess(res, { received: true }, 'Feedback submitted');
});

const getHistory = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const history = await getHistoryForProject(req.user.userId, projectId);
  return sendSuccess(res, history, 'AI history fetched');
});

module.exports = {
  analyzeDeployment,
  getDiagnosis,
  handleChat,
  executeFix,
  getKnowledgeBase,
  getRecommendations,
  getSecurityScan,
  getPerformanceScan,
  getReport,
  submitFeedback,
  getHistory,
};
