/**
 * ZipExtractor.js
 * Handles extracting ZIP source archives into project directories
 * and optional Supabase Storage bucket persistence.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../config/supabase');

async function extractZip(zipFilePath, destDir) {
  await fs.promises.mkdir(destDir, { recursive: true });

  const isWindows = process.platform === 'win32';
  const extractCmd = isWindows
    ? `powershell -Command "Expand-Archive -Path '${zipFilePath}' -DestinationPath '${destDir}' -Force"`
    : `unzip -o "${zipFilePath}" -d "${destDir}"`;

  return new Promise((resolve, reject) => {
    exec(extractCmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Failed to extract ZIP: ${stderr || error.message}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function uploadZipToSupabaseStorage(projectId, filePath) {
  try {
    const supabase = getSupabaseClient();
    const fileBuffer = await fs.promises.readFile(filePath);
    const storagePath = `projects/${projectId}/source.zip`;

    const { data, error } = await supabase.storage
      .from('projects')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/zip',
        upsert: true
      });

    if (error) {
      // Storage bucket might not exist yet; log silently or return null
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

module.exports = { extractZip, uploadZipToSupabaseStorage };
