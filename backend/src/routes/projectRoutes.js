const express = require('express');
const path = require('path');
const multer = require('multer');
const controller = require('../controllers/projectController');
const { requireAuth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { createProjectSchema, projectIdSchema, importGithubSchema } = require('../validators/projectValidators');

const router = express.Router();

// Multer storage settings for zipped packages
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.get('/', requireAuth, controller.listProjects);
router.post('/', requireAuth, validateRequest(createProjectSchema), controller.createProject);
router.patch('/:projectId/archive', requireAuth, validateRequest(projectIdSchema), controller.archiveProject);
router.patch('/:projectId', requireAuth, validateRequest(projectIdSchema), controller.updateProject);
router.delete('/:projectId', requireAuth, validateRequest(projectIdSchema), controller.deleteProject);

router.post('/upload', requireAuth, upload.single('file'), controller.uploadProject);
router.post('/import-github', requireAuth, validateRequest(importGithubSchema), controller.importGithub);

module.exports = { projectRoutes: router };
