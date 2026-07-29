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

async function diagnoseDeployment(userId, deploymentId) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) throw new Error('Deployment not found');

  const project = await projectRepository.findByIdAndOwner(deployment.projectId, userId);
  if (!project) throw new Error('Project not found or unauthorized');

  const logs = await deploymentLogRepository.listByDeployment(deploymentId);
  const diagnosis = await analyzeWithAI({ project, deployment, logs });

  const recordPayload = {
    id: uuidv4(),
    deploymentId,
    projectId: project._id ? project._id.toString() : project.id,
    ...diagnosis
  };

  try {
    const supabase = getSupabaseClient();
    const snake = mapObjToSnake(recordPayload);
    const { data, error } = await supabase.from('ai_diagnoses').insert([snake]).select().single();
    if (!error && data) {
      await recordKnowledge(diagnosis);
      return mapRowToCamel(data);
    }
  } catch (_) {}

  // Fallback in-memory persistence
  inMemoryDiagnoses.set(deploymentId, recordPayload);
  await recordKnowledge(diagnosis);
  return recordPayload;
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
      .from('deployments')
      .select(`
        *,
        ai_diagnoses (
          id,
          error_type,
          severity,
          root_cause,
          human_explanation
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (data) {
      return data.map(d => mapRowToCamel(d));
    }
  } catch (e) {
    // console.error(e)
  }
  
  return [];
}

module.exports = { diagnoseDeployment, getDiagnosisByDeployment, getHistoryForProject };

