const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { ApiError } = require('../errors/ApiError');
const { projectRepository } = require('../repositories/projectRepository');
const { detectFramework } = require('../frameworkDetector/detector');
const { generateDockerfile } = require('../dockerGenerator/dockerfileGenerator');

async function listProjects(userId, { archived }) {
  const filter = typeof archived === 'boolean' ? { archived } : {};
  return projectRepository.listByOwner(userId, filter);
}

async function createProject(userId, payload) {
  const { name, repositoryUrl, repositoryProvider = 'manual', packageJson = {}, fileNames = [], envVars = [] } = payload;

  const detection = detectFramework(fileNames, packageJson);

  const created = await projectRepository.create({
    ownerId: userId,
    name,
    repositoryUrl,
    repositoryProvider,
    framework: detection.framework,
    language: detection.language,
    metadata: {
      packageJson,
      fileNames,
      dockerfile: generateDockerfile(detection.framework)
    },
    envVars
  });

  return created;
}

async function archiveProject(userId, projectId) {
  const project = await projectRepository.updateByIdAndOwner(projectId, userId, { archived: true });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
}

async function deleteProject(userId, projectId) {
  const project = await projectRepository.deleteByIdAndOwner(projectId, userId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Delete project source directory if it exists
  const sourceDir = path.join(__dirname, `../../projects_source/${projectId}`);
  try {
    await fs.promises.rm(sourceDir, { recursive: true, force: true });
  } catch (_) {}

  return project;
}

async function uploadProject(userId, payload, file) {
  if (!file) {
    throw new ApiError(400, 'Project source ZIP file is required');
  }

  const { name, envVars = [] } = payload;
  
  // We first create a placeholder project in db to get the ID
  const tempProject = await projectRepository.create({
    ownerId: userId,
    name: name.toLowerCase().trim(),
    repositoryProvider: 'zip',
    framework: 'Unknown',
    language: 'Unknown',
    envVars
  });

  const projectId = tempProject._id.toString();
  const destDir = path.join(__dirname, `../../projects_source/${projectId}`);
  await fs.promises.mkdir(destDir, { recursive: true });

  const isWindows = process.platform === 'win32';
  const extractCmd = isWindows
    ? `powershell -Command "Expand-Archive -Path '${file.path}' -DestinationPath '${destDir}' -Force"`
    : `unzip -o "${file.path}" -d "${destDir}"`;

  try {
    await new Promise((resolve, reject) => {
      exec(extractCmd, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Scan extracted files
    const fileNames = await fs.promises.readdir(destDir);
    let packageJson = {};
    if (fileNames.includes('package.json')) {
      try {
        packageJson = JSON.parse(await fs.promises.readFile(path.join(destDir, 'package.json'), 'utf8'));
      } catch (_) {}
    }

    const detection = detectFramework(fileNames, packageJson);

    tempProject.framework = detection.framework;
    tempProject.language = detection.language;
    tempProject.metadata = {
      packageJson,
      fileNames,
      dockerfile: generateDockerfile(detection.framework)
    };

    await tempProject.save();
    return tempProject;
  } catch (error) {
    // Cleanup database and files on error
    await projectRepository.deleteByIdAndOwner(projectId, userId);
    try {
      await fs.promises.rm(destDir, { recursive: true, force: true });
    } catch (_) {}
    throw new ApiError(500, `Failed to process uploaded ZIP: ${error.message}`);
  } finally {
    // Delete temp upload zip
    try {
      await fs.promises.unlink(file.path);
    } catch (_) {}
  }
}

async function importGithub(userId, payload) {
  const { name, repositoryUrl, envVars = [] } = payload;

  const tempProject = await projectRepository.create({
    ownerId: userId,
    name: name.toLowerCase().trim(),
    repositoryUrl,
    repositoryProvider: 'github',
    framework: 'Unknown',
    language: 'Unknown',
    envVars
  });

  const projectId = tempProject._id.toString();
  const destDir = path.join(__dirname, `../../projects_source/${projectId}`);
  await fs.promises.mkdir(destDir, { recursive: true });

  try {
    await new Promise((resolve, reject) => {
      exec(`git clone --depth 1 "${repositoryUrl}" "${destDir}"`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const fileNames = await fs.promises.readdir(destDir);
    let packageJson = {};
    if (fileNames.includes('package.json')) {
      try {
        packageJson = JSON.parse(await fs.promises.readFile(path.join(destDir, 'package.json'), 'utf8'));
      } catch (_) {}
    }

    const detection = detectFramework(fileNames, packageJson);

    tempProject.framework = detection.framework;
    tempProject.language = detection.language;
    tempProject.metadata = {
      packageJson,
      fileNames,
      dockerfile: generateDockerfile(detection.framework)
    };

    await tempProject.save();
    return tempProject;
  } catch (error) {
    await projectRepository.deleteByIdAndOwner(projectId, userId);
    try {
      await fs.promises.rm(destDir, { recursive: true, force: true });
    } catch (_) {}
    throw new ApiError(500, `Failed to clone and import GitHub repository: ${error.message}`);
  }
}

async function updateProject(userId, projectId, payload) {
  const { name, envVars, metadata } = payload;
  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (name !== undefined) project.name = name;
  if (envVars !== undefined) project.envVars = envVars;
  if (metadata !== undefined) {
    project.metadata = {
      ...(project.metadata || {}),
      ...metadata
    };
  }

  await project.save();
  return project;
}

module.exports = {
  listProjects,
  createProject,
  archiveProject,
  deleteProject,
  uploadProject,
  importGithub,
  updateProject
};
