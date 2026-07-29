/**
 * RecommendationService.js
 * Generates tailored recommendations and doc links based on project framework and errors.
 */

function getRecommendationsForProject(project, lastError = null) {
  const fw = project?.framework || 'Node.js';

  const baseRecommendations = [
    {
      id: 'rec-1',
      title: 'Enable Compression Middleware',
      category: 'Performance',
      description: 'Add `compression` npm package to gzip responses and reduce network payload sizes by up to 70%.',
      impact: 'High'
    },
    {
      id: 'rec-2',
      title: 'Configure Health Check Endpoint',
      category: 'Reliability',
      description: 'Expose a dedicated GET `/health` route returning HTTP 200 JSON status for automated pings.',
      impact: 'High'
    },
    {
      id: 'rec-3',
      title: 'Secure Environment Key Storage',
      category: 'Security',
      description: 'Ensure sensitive secrets (DATABASE_URL, JWT_SECRET) are stored as encrypted environment variables.',
      impact: 'Critical'
    }
  ];

  if (fw === 'React' || fw === 'Vite' || fw === 'Next.js') {
    baseRecommendations.push({
      id: 'rec-4',
      title: 'Enable Route-based Code Splitting',
      category: 'Performance',
      description: 'Use React.lazy() and Suspense to lazy-load heavy page bundles and speed up initial page render.',
      impact: 'Medium'
    });
  }

  return baseRecommendations;
}

module.exports = { getRecommendationsForProject };
