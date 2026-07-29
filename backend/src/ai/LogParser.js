/**
 * LogParser.js
 * Parses raw build and runtime logs, strips noise, isolates error trace lines,
 * and extracts affected source files.
 */

function parseLogs(logsInput = []) {
  const logLines = Array.isArray(logsInput)
    ? logsInput.map((l) => (typeof l === 'object' ? l.message : String(l)))
    : String(logsInput).split('\n');

  const errorLines = [];
  const affectedFilesSet = new Set();
  let extractedErrorCode = null;
  let missingPackageName = null;

  const fileRegex = /([a-zA-Z0-9_\-\/]+\.(?:tsx?|jsx?|py|java|go|rs|php|json|yml|yaml|toml|gradle|xml))/gi;
  const missingPkgRegex = /(?:cannot find module|module not found|no module named|package ['"]?([^'"]+)['"]? not found)/i;
  const errorCodeRegex = /(E[A-Z0-9]+|ERR_[A-Z0-9_]+|code [A-Z0-9_]+)/i;

  logLines.forEach((line) => {
    const isError = /error|failed|exception|fatal|eaddrinuse|eresolve|cannot find/i.test(line);

    if (isError) {
      errorLines.push(line.trim());

      // Extract file references
      const matches = line.match(fileRegex);
      if (matches) {
        matches.forEach((file) => {
          if (!file.includes('node_modules') && !file.includes('dist/')) {
            affectedFilesSet.add(file.replace(/^.*[\\\/]/, ''));
          }
        });
      }

      // Extract missing package
      const pkgMatch = line.match(missingPkgRegex);
      if (pkgMatch && pkgMatch[1]) {
        missingPackageName = pkgMatch[1].replace(/['"]/g, '');
      }

      // Extract error code
      const codeMatch = line.match(errorCodeRegex);
      if (codeMatch && codeMatch[1]) {
        extractedErrorCode = codeMatch[1];
      }
    }
  });

  const affectedFiles = Array.from(affectedFilesSet);
  if (affectedFiles.length === 0) {
    affectedFiles.push('package.json');
  }

  return {
    rawLogCount: logLines.length,
    errorLines: errorLines.slice(0, 30),
    summaryText: errorLines.slice(0, 5).join(' | '),
    affectedFiles,
    missingPackageName,
    extractedErrorCode
  };
}

module.exports = { parseLogs };
