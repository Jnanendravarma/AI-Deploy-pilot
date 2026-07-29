/**
 * FrameworkDetector.js
 * Automatically detects application frameworks, languages, build commands,
 * start commands, and internal default ports based on project structure.
 */

function detectFramework(fileNames = [], packageJson = {}, extraFiles = {}) {
  const deps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };

  const files = fileNames.map((f) => (typeof f === 'string' ? f.toLowerCase() : ''));

  // 1. Next.js
  if (deps.next || files.includes('next.config.js') || files.includes('next.config.mjs') || files.includes('next.config.ts')) {
    return {
      framework: 'Next.js',
      language: 'JavaScript / TypeScript',
      buildCommand: packageJson.scripts?.build ? 'npm run build' : 'next build',
      startCommand: packageJson.scripts?.start ? 'npm run start' : 'next start',
      defaultPort: 3000,
      outputDir: '.next'
    };
  }

  // 2. NestJS
  if (deps['@nestjs/core'] || files.includes('nest-cli.json')) {
    return {
      framework: 'NestJS',
      language: 'TypeScript',
      buildCommand: packageJson.scripts?.build ? 'npm run build' : 'nest build',
      startCommand: packageJson.scripts?.start ? 'npm run start' : 'node dist/main',
      defaultPort: 3000,
      outputDir: 'dist'
    };
  }

  // 3. Vue / Nuxt
  if (deps.nuxt || files.includes('nuxt.config.js') || files.includes('nuxt.config.ts')) {
    return {
      framework: 'Nuxt',
      language: 'JavaScript / TypeScript',
      buildCommand: packageJson.scripts?.build ? 'npm run build' : 'nuxt build',
      startCommand: packageJson.scripts?.start ? 'npm run start' : 'node .output/server/index.mjs',
      defaultPort: 3000,
      outputDir: '.output'
    };
  }
  if (deps.vue || files.includes('vue.config.js')) {
    return {
      framework: 'Vue',
      language: 'JavaScript / TypeScript',
      buildCommand: packageJson.scripts?.build ? 'npm run build' : 'vite build',
      startCommand: packageJson.scripts?.preview ? 'npm run preview' : 'npx serve -s dist',
      defaultPort: 4173,
      outputDir: 'dist'
    };
  }

  // 4. Angular
  if (deps['@angular/core'] || files.includes('angular.json')) {
    return {
      framework: 'Angular',
      language: 'TypeScript',
      buildCommand: packageJson.scripts?.build ? 'npm run build' : 'ng build',
      startCommand: 'npx serve -s dist',
      defaultPort: 4200,
      outputDir: 'dist'
    };
  }

  // 5. React / Vite
  if (deps.react || deps.vite || files.includes('vite.config.ts') || files.includes('vite.config.js')) {
    return {
      framework: 'React',
      language: 'JavaScript / TypeScript',
      buildCommand: packageJson.scripts?.build ? 'npm run build' : 'vite build',
      startCommand: packageJson.scripts?.preview ? 'npm run preview -- --host 0.0.0.0' : 'npx serve -s dist',
      defaultPort: 4173,
      outputDir: 'dist'
    };
  }

  // 6. Express / Node.js
  if (deps.express || packageJson.main || files.includes('package.json')) {
    const mainFile = packageJson.main || 'server.js';
    return {
      framework: deps.express ? 'Express' : 'Node.js',
      language: 'JavaScript',
      buildCommand: packageJson.scripts?.build ? 'npm run build' : '',
      startCommand: packageJson.scripts?.start ? 'npm run start' : `node ${mainFile}`,
      defaultPort: 3000,
      outputDir: '.'
    };
  }

  // 7. Python - Django
  if (files.includes('manage.py') || files.includes('wsgi.py')) {
    return {
      framework: 'Django',
      language: 'Python',
      buildCommand: files.includes('requirements.txt') ? 'pip install -r requirements.txt' : '',
      startCommand: 'python manage.py runserver 0.0.0.0:8000',
      defaultPort: 8000,
      outputDir: '.'
    };
  }

  // 8. Python - FastAPI
  if (deps.fastapi || files.includes('main.py')) {
    return {
      framework: 'FastAPI',
      language: 'Python',
      buildCommand: files.includes('requirements.txt') ? 'pip install -r requirements.txt' : '',
      startCommand: 'uvicorn main:app --host 0.0.0.0 --port 8000',
      defaultPort: 8000,
      outputDir: '.'
    };
  }

  // 9. Python - Flask / Generic
  if (files.includes('requirements.txt') || files.includes('pipfile') || files.includes('pyproject.toml') || files.some((f) => f.endsWith('.py'))) {
    return {
      framework: 'Flask',
      language: 'Python',
      buildCommand: 'pip install -r requirements.txt',
      startCommand: 'python app.py',
      defaultPort: 5000,
      outputDir: '.'
    };
  }

  // 10. Java - Spring Boot
  if (files.includes('pom.xml') || files.includes('build.gradle') || files.includes('build.gradle.kts')) {
    const isMaven = files.includes('pom.xml');
    return {
      framework: 'Spring Boot',
      language: 'Java',
      buildCommand: isMaven ? './mvnw clean package -DskipTests' : './gradlew build -x test',
      startCommand: 'java -jar target/*.jar',
      defaultPort: 8080,
      outputDir: 'target'
    };
  }

  // 11. PHP - Laravel
  if (files.includes('artisan') || files.includes('composer.json')) {
    return {
      framework: 'Laravel',
      language: 'PHP',
      buildCommand: 'composer install --no-dev --optimize-autoloader',
      startCommand: 'php artisan serve --host=0.0.0.0 --port=8000',
      defaultPort: 8000,
      outputDir: '.'
    };
  }

  // 12. Go
  if (files.includes('go.mod') || files.some((f) => f.endsWith('.go'))) {
    return {
      framework: 'Go',
      language: 'Go',
      buildCommand: 'go build -o server .',
      startCommand: './server',
      defaultPort: 8080,
      outputDir: '.'
    };
  }

  // 13. Rust
  if (files.includes('cargo.toml') || files.some((f) => f.endsWith('.rs'))) {
    return {
      framework: 'Rust',
      language: 'Rust',
      buildCommand: 'cargo build --release',
      startCommand: './target/release/app',
      defaultPort: 8080,
      outputDir: 'target/release'
    };
  }

  // 14. Static Website
  if (files.includes('index.html')) {
    return {
      framework: 'Static Website',
      language: 'HTML / CSS / JS',
      buildCommand: '',
      startCommand: 'nginx -g "daemon off;"',
      defaultPort: 80,
      outputDir: '.'
    };
  }

  // Default fallback
  return {
    framework: 'Node.js',
    language: 'JavaScript',
    buildCommand: 'npm run build',
    startCommand: 'npm run start',
    defaultPort: 3000,
    outputDir: '.'
  };
}

module.exports = { detectFramework };
