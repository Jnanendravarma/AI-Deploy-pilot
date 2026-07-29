/**
 * RepositoryDownloader.js
 * Downloads/clones GitHub repositories and checks out target branches.
 */

const { exec } = require('child_process');
const fs = require('fs');

async function downloadRepository(repositoryUrl, branch = 'main', destDir) {
  if (!repositoryUrl) {
    throw new Error('Repository URL is required');
  }

  await fs.promises.mkdir(destDir, { recursive: true });

  const cleanUrl = repositoryUrl.replace(/\/$/, '');
  const cloneCmd = `git clone --depth 1 --single-branch -b ${branch} "${cleanUrl}" "${destDir}"`;

  return new Promise((resolve, reject) => {
    exec(cloneCmd, (error, stdout, stderr) => {
      if (error) {
        // Fallback without branch flag if branch fails
        const fallbackCmd = `git clone --depth 1 "${cleanUrl}" "${destDir}"`;
        exec(fallbackCmd, (fbErr, fbOut, fbStderr) => {
          if (fbErr) {
            reject(new Error(`Failed to clone repository: ${fbStderr || fbErr.message}`));
          } else {
            resolve({ stdout: fbOut, stderr: fbStderr });
          }
        });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

module.exports = { downloadRepository };
