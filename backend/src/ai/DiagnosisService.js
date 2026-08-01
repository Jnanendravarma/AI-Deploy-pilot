/**
 * DiagnosisService.js
 * Generates and stores AI diagnoses for failed deployments.
 */

const { deploymentRepository } = require('../repositories/deploymentRepository');
const { projectRepository } = require('../repositories/projectRepository');
const { deploymentLogRepository } = require('../repositories/deploymentLogRepository');
const { analyzeWithAI } = require('./AIEngine');
const { recordKnowledge } = require('./KnowledgeBase');
const { getSupabaseClient } = require('../config/supabase');
const { mapObjToSnake, mapRowToCamel } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

// Memory store fallback for diagnoses
const inMemoryDiagnoses = new Map();

function getEntityId(entity) {
  return entity?._id ? entity._id.toString() : entity?.id;
}

function buildDiagnosisRecord(project, deployment, diagnosis) {
  return {
    id: uuidv4(),
    deploymentId: getEntityId(deployment),
    projectId: getEntityId(project),
    ...diagnosis
  };
}

async function persistDiagnosis(project, deployment, diagnosis) {
  const recordPayload = buildDiagnosisRecord(project, deployment, diagnosis);

  try {
    const supabase = getSupabaseClient();
    const snake = mapObjToSnake(recordPayload);
    const { data, error } = await supabase.from('ai_diagnoses').insert([snake]).select().single();
    if (!error && data) {
      await recordKnowledge(diagnosis);
      return mapRowToCamel(data);
    }
  } catch (_) {}

  inMemoryDiagnoses.set(recordPayload.deploymentId, recordPayload);
  await recordKnowledge(diagnosis);
  return recordPayload;
}

async function persistDeploymentError(project, deployment, diagnosis) {
  const possibleCauses = Array.isArray(diagnosis.suggestedFixes) && diagnosis.suggestedFixes.length > 0
    ? diagnosis.suggestedFixes
    : [diagnosis.humanExplanation || diagnosis.rootCause].filter(Boolean);

  const errorRecord = {
    id: uuidv4(),
    deploymentId: getEntityId(deployment),
    projectId: getEntityId(project),
    rootCause: diagnosis.rootCause,
    possibleCauses,
    confidenceScore: diagnosis.confidenceScore || 90,
    suggestedFix: Array.isArray(diagnosis.suggestedFixes) ? diagnosis.suggestedFixes[0] || diagnosis.rootCause : String(diagnosis.suggestedFixes || diagnosis.rootCause),
    severity: diagnosis.severity || 'Medium',
    resolved: false
  };

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('deployment_errors').insert([mapObjToSnake(errorRecord)]).select().single();
    if (!error && data) {
      return mapRowToCamel(data);
    }
  } catch (_) {}

  return errorRecord;
}

async function analyzeAndStoreDiagnosis({ project, deployment, logs = [] }) {
  const diagnosis = await analyzeWithAI({ project, deployment, logs });
  const storedDiagnosis = await persistDiagnosis(project, deployment, diagnosis);
  await persistDeploymentError(project, deployment, diagnosis);
  return storedDiagnosis;
}

async function diagnoseDeployment(userId, deploymentId) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) throw new Error('Deployment not found');

  const project = await projectRepository.findByIdAndOwner(deployment.projectId, userId);
  if (!project) throw new Error('Project not found or unauthorized');

  const logs = await deploymentLogRepository.listByDeployment(deploymentId);
  return analyzeAndStoreDiagnosis({ project, deployment, logs });
}

async function getDiagnosisByDeployment(userId, deploymentId) {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('ai_diagnoses').select('*').eq('deployment_id', deploymentId).maybeSingle();
    if (data) return mapRowToCamel(data);
  } catch (_) {}

  if (inMemoryDiagnoses.has(deploymentId)) {
    return inMemoryDiagnoses.get(deploymentId);
  }

  // Fallback: run diagnosis on the fly
  return diagnoseDeployment(userId, deploymentId);
}

async function getHistoryForProject(userId, projectId) {
  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) throw new Error('Project not found or unauthorized');

  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('ai_diagnoses')
      .select('*')
      .eq('project_id', getEntityId(project))
      .order('created_at', { ascending: false });

    if (data) {
      return data.map(d => mapRowToCamel(d));
    }
  } catch (e) {
    // console.error(e)
  }
  
  return [];
}

async function analyzeDeploymentFailure({ project, deployment, logs = [] }) {
  if (!project || !deployment) {
    throw new Error('Project and deployment are required for AI analysis');
  }

  return analyzeAndStoreDiagnosis({ project, deployment, logs });
}

module.exports = { diagnoseDeployment, getDiagnosisByDeployment, getHistoryForProject, analyzeDeploymentFailure };

