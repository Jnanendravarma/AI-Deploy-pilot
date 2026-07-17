function detectFramework(files = [], packageJson = {}) {
  const deps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };

  if (deps.next) return { framework: 'Next.js', language: 'JavaScript/TypeScript' };
  if (deps.react && deps.vite) return { framework: 'Vite', language: 'JavaScript/TypeScript' };
  if (deps.react) return { framework: 'React', language: 'JavaScript/TypeScript' };
  if (deps.express) return { framework: 'Express', language: 'Node.js' };
  if (deps.vue) return { framework: 'Vue', language: 'JavaScript/TypeScript' };
  if (deps['@angular/core']) return { framework: 'Angular', language: 'TypeScript' };
  if (deps.fastapi || files.includes('main.py')) return { framework: 'FastAPI', language: 'Python' };
  if (deps.laravel || files.includes('artisan')) return { framework: 'Laravel', language: 'PHP' };
  if (files.includes('pom.xml') || files.includes('build.gradle')) return { framework: 'Spring Boot', language: 'Java' };
  if (files.includes('package.json')) return { framework: 'Node', language: 'JavaScript' };
  return { framework: 'Unknown', language: 'Unknown' };
}

module.exports = { detectFramework };
