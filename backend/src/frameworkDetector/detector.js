function detectFramework(files = [], packageJson = {}) {
  const deps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };

  if (deps.next || files.includes('next.config.js') || files.includes('next.config.mjs')) return { framework: 'Next.js', language: 'JavaScript / TypeScript' };
  if (deps.react || deps.vite || files.includes('vite.config.ts') || files.includes('vite.config.js')) return { framework: 'React', language: 'JavaScript / TypeScript' };
  if (deps.vue || files.includes('vue.config.js')) return { framework: 'Vue.js', language: 'JavaScript / TypeScript' };
  if (deps['@angular/core'] || files.includes('angular.json')) return { framework: 'Angular', language: 'TypeScript' };
  if (files.includes('manage.py') || files.includes('wsgi.py')) return { framework: 'Django', language: 'Python' };
  if (deps.fastapi || files.includes('main.py')) return { framework: 'FastAPI', language: 'Python' };
  if (files.includes('requirements.txt') || files.includes('Pipfile') || files.includes('pyproject.toml')) return { framework: 'Python', language: 'Python' };
  if (files.includes('pom.xml') || files.includes('build.gradle')) return { framework: 'Spring Boot', language: 'Java' };
  if (files.some(f => typeof f === 'string' && f.endsWith('.java'))) return { framework: 'Java', language: 'Java' };
  if (files.includes('artisan') || files.includes('composer.json')) return { framework: 'Laravel', language: 'PHP' };
  if (files.includes('package.json') || deps.express) return { framework: 'Node.js', language: 'JavaScript' };
  return { framework: 'React', language: 'JavaScript / TypeScript' };
}

module.exports = { detectFramework };
