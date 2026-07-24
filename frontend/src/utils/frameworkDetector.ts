export interface FrameworkInfo {
  key: string;
  name: string;
  language: string;
  badgeColor: string;
  iconBg: string;
  defaultBuildCmd: string;
  defaultOutputDir: string;
}

export const FRAMEWORKS: Record<string, FrameworkInfo> = {
  nextjs: {
    key: 'nextjs',
    name: 'Next.js',
    language: 'JavaScript / TypeScript',
    badgeColor: 'bg-black border-white/20 text-white',
    iconBg: 'from-slate-900 to-black',
    defaultBuildCmd: 'npm run build',
    defaultOutputDir: '.next'
  },
  react: {
    key: 'react',
    name: 'React',
    language: 'JavaScript / TypeScript',
    badgeColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    iconBg: 'from-cyan-500/20 to-blue-600/20',
    defaultBuildCmd: 'npm run build',
    defaultOutputDir: 'dist'
  },
  nodejs: {
    key: 'nodejs',
    name: 'Node.js',
    language: 'JavaScript / TypeScript',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    iconBg: 'from-emerald-500/20 to-green-600/20',
    defaultBuildCmd: 'npm run build',
    defaultOutputDir: 'dist'
  },
  vue: {
    key: 'vue',
    name: 'Vue.js',
    language: 'JavaScript / TypeScript',
    badgeColor: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300',
    iconBg: 'from-emerald-400/20 to-teal-600/20',
    defaultBuildCmd: 'npm run build',
    defaultOutputDir: 'dist'
  },
  angular: {
    key: 'angular',
    name: 'Angular',
    language: 'TypeScript',
    badgeColor: 'bg-red-500/10 border-red-500/20 text-red-400',
    iconBg: 'from-red-500/20 to-rose-600/20',
    defaultBuildCmd: 'ng build',
    defaultOutputDir: 'dist'
  },
  python: {
    key: 'python',
    name: 'Python',
    language: 'Python',
    badgeColor: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    iconBg: 'from-yellow-500/20 to-amber-600/20',
    defaultBuildCmd: 'pip install -r requirements.txt',
    defaultOutputDir: '.'
  },
  django: {
    key: 'django',
    name: 'Django',
    language: 'Python',
    badgeColor: 'bg-emerald-600/10 border-emerald-600/20 text-emerald-400',
    iconBg: 'from-emerald-600/20 to-teal-800/20',
    defaultBuildCmd: 'python manage.py collectstatic --noinput',
    defaultOutputDir: 'static'
  },
  fastapi: {
    key: 'fastapi',
    name: 'FastAPI',
    language: 'Python',
    badgeColor: 'bg-teal-500/10 border-teal-500/20 text-teal-300',
    iconBg: 'from-teal-500/20 to-emerald-700/20',
    defaultBuildCmd: 'pip install -r requirements.txt',
    defaultOutputDir: '.'
  },
  java: {
    key: 'java',
    name: 'Java',
    language: 'Java',
    badgeColor: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    iconBg: 'from-orange-500/20 to-red-600/20',
    defaultBuildCmd: './mvnw clean package',
    defaultOutputDir: 'target'
  },
  springboot: {
    key: 'springboot',
    name: 'Spring Boot',
    language: 'Java',
    badgeColor: 'bg-green-500/10 border-green-500/20 text-green-400',
    iconBg: 'from-green-500/20 to-emerald-600/20',
    defaultBuildCmd: './mvnw spring-boot:run',
    defaultOutputDir: 'target'
  },
  laravel: {
    key: 'laravel',
    name: 'Laravel',
    language: 'PHP',
    badgeColor: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    iconBg: 'from-rose-500/20 to-red-700/20',
    defaultBuildCmd: 'composer install --no-dev --optimize-autoloader',
    defaultOutputDir: 'public'
  }
};

export function autoDetectFramework(input: string, fileList: string[] = []): FrameworkInfo {
  const str = input.toLowerCase();

  if (str.includes('next') || fileList.includes('next.config.js') || fileList.includes('next.config.mjs')) {
    return FRAMEWORKS.nextjs;
  }
  if (str.includes('django') || fileList.includes('manage.py') || fileList.includes('wsgi.py')) {
    return FRAMEWORKS.django;
  }
  if (str.includes('fastapi') || (fileList.includes('main.py') && str.includes('api'))) {
    return FRAMEWORKS.fastapi;
  }
  if (str.includes('spring') || fileList.includes('pom.xml') || fileList.includes('build.gradle')) {
    return FRAMEWORKS.springboot;
  }
  if (str.includes('java') || fileList.some(f => f.endsWith('.java'))) {
    return FRAMEWORKS.java;
  }
  if (str.includes('laravel') || fileList.includes('artisan') || fileList.includes('composer.json')) {
    return FRAMEWORKS.laravel;
  }
  if (str.includes('angular') || fileList.includes('angular.json')) {
    return FRAMEWORKS.angular;
  }
  if (str.includes('vue') || fileList.includes('vue.config.js')) {
    return FRAMEWORKS.vue;
  }
  if (str.includes('python') || str.includes('py') || fileList.includes('requirements.txt') || fileList.includes('Pipfile')) {
    return FRAMEWORKS.python;
  }
  if (str.includes('vite') || str.includes('react') || fileList.includes('vite.config.ts') || fileList.includes('vite.config.js')) {
    return FRAMEWORKS.react;
  }
  if (str.includes('node') || fileList.includes('package.json')) {
    return FRAMEWORKS.nodejs;
  }

  return FRAMEWORKS.react;
}
