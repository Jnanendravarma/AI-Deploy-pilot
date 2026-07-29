/**
 * ErrorClassifier.js
 * Classifies failure logs into 10 key domain categories and assigns severity ratings.
 */

const CATEGORIES = [
  'Dependency',
  'Docker',
  'Framework',
  'Database',
  'Authentication',
  'Environment',
  'Networking',
  'Runtime',
  'Configuration',
  'Build'
];

function classifyError(errorMessage = '', logSummary = '') {
  const text = `${errorMessage} ${logSummary}`.toLowerCase();

  // 1. Environment & Secrets
  if (/missing env|environment variable|jwt_secret|api_key|supabase_key|undefined env/i.test(text)) {
    return {
      category: 'Environment',
      severity: 'Critical',
      errorType: 'Missing Environment Variable'
    };
  }

  // 2. Database
  if (/mongo|postgres|database|econnrefused|auth failed|connection refused|prisma|sequelize|typeorm/i.test(text)) {
    return {
      category: 'Database',
      severity: 'High',
      errorType: 'Database Connection Failure'
    };
  }

  // 3. Dependency
  if (/cannot find module|module not found|eresolve|peer dep|package not found|npm err!|yarn error|pip install/i.test(text)) {
    return {
      category: 'Dependency',
      severity: 'Medium',
      errorType: 'Missing Dependency'
    };
  }

  // 4. Docker
  if (/docker|container|dockerfile|daemon|dockerode|cannot connect to docker/i.test(text)) {
    return {
      category: 'Docker',
      severity: 'High',
      errorType: 'Docker Engine Failure'
    };
  }

  // 5. Networking / Port
  if (/eaddrinuse|port in use|cors|address already in use|networkerror/i.test(text)) {
    return {
      category: 'Networking',
      severity: 'Medium',
      errorType: text.includes('eaddrinuse') ? 'Port Binding Conflict (EADDRINUSE)' : 'CORS Block'
    };
  }

  // 6. Health Check
  if (/health check|ping failed|unhealthy container|status 500|status 502/i.test(text)) {
    return {
      category: 'Runtime',
      severity: 'High',
      errorType: 'Health Check Ping Failure'
    };
  }

  // 7. Authentication / OAuth
  if (/oauth|redirect_uri_mismatch|unauthorized|401|403|token expired/i.test(text)) {
    return {
      category: 'Authentication',
      severity: 'High',
      errorType: 'Authentication Mismatch'
    };
  }

  // 8. Framework / Build
  if (/typeerror|syntaxerror|next build|vite build|tsc|tsconfig|compile/i.test(text)) {
    return {
      category: 'Build',
      severity: 'Medium',
      errorType: 'Compilation / Build Error'
    };
  }

  // Default fallback
  return {
    category: 'Build',
    severity: 'Medium',
    errorType: 'General Build Failure'
  };
}

module.exports = { classifyError, CATEGORIES };
