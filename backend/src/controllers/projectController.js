const { asyncHandler } = require('../middleware/asyncHandler');
const projectService = require('../services/projectService');
const { sendSuccess } = require('../utils/response');

const listProjects = asyncHandler(async (req, res) => {
  const archived = req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined;
  const projects = await projectService.listProjects(req.user.userId, { archived });
  return sendSuccess(res, projects, 'Projects fetched');
});

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.userId, req.body);
  return sendSuccess(res, project, 'Project created', 201);
});

const archiveProject = asyncHandler(async (req, res) => {
  const project = await projectService.archiveProject(req.user.userId, req.params.projectId);
  return sendSuccess(res, project, 'Project archived');
});

const deleteProject = asyncHandler(async (req, res) => {
  const deleted = await projectService.deleteProject(req.user.userId, req.params.projectId);
  return sendSuccess(res, deleted, 'Project deleted');
});

const uploadProject = asyncHandler(async (req, res) => {
  const envVars = req.body.envVars
    ? (typeof req.body.envVars === 'string' ? JSON.parse(req.body.envVars) : req.body.envVars)
    : [];
  const project = await projectService.uploadProject(req.user.userId, { name: req.body.name, envVars }, req.file);
  return sendSuccess(res, project, 'Project uploaded and created', 201);
});

const importGithub = asyncHandler(async (req, res) => {
  const project = await projectService.importGithub(req.user.userId, req.body);
  return sendSuccess(res, project, 'Project imported from GitHub', 201);
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.user.userId, req.params.projectId, req.body);
  return sendSuccess(res, project, 'Project updated');
});

module.exports = {
  listProjects,
  createProject,
  archiveProject,
  deleteProject,
  uploadProject,
  importGithub,
  updateProject
};
