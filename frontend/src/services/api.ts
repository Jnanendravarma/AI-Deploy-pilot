export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAccessToken() {
  return localStorage.getItem('deploypilot_access_token');
}

function getRefreshToken() {
  return localStorage.getItem('deploypilot_refresh_token');
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('deploypilot_access_token', accessToken);
  localStorage.setItem('deploypilot_refresh_token', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('deploypilot_access_token');
  localStorage.removeItem('deploypilot_refresh_token');
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const payload = (await response.json()) as ApiEnvelope<{ accessToken: string; refreshToken: string }>;
  setTokens(payload.data.accessToken, payload.data.refreshToken);
  return payload.data.accessToken;
}

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const payload = (await response.json()) as ApiEnvelope<T> & { details?: unknown };
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, withAuth = true): Promise<ApiEnvelope<T>> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (withAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401 && withAuth) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Content-Type', 'application/json');
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
      response = await fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders });
    }
  }

  return parseResponse<T>(response);
}

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    apiRequest<{ user: { userId: string; name: string; email: string; role: string; avatar?: string }; accessToken: string; refreshToken: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(body) },
      false
    ),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ user: { userId: string; name: string; email: string; role: string; avatar?: string }; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(body) },
      false
    ),
  me: () => apiRequest<{ user: { userId: string; name: string; email: string; role: string; avatar?: string } }>('/auth/me')
};

export const projectApi = {
  list: () => apiRequest<Array<Record<string, unknown>>>('/projects'),
  create: (body: Record<string, unknown>) => apiRequest<Record<string, unknown>>('/projects', { method: 'POST', body: JSON.stringify(body) }),
  upload: async (formData: FormData) => {
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/projects/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    return parseResponse<Record<string, unknown>>(res);
  },
  importGithub: (body: Record<string, unknown>) => apiRequest<Record<string, unknown>>('/projects/import-github', { method: 'POST', body: JSON.stringify(body) }),
  update: (projectId: string, body: Record<string, unknown>) => apiRequest<Record<string, unknown>>(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateEnvironment: (projectId: string, envVars: Array<{ key: string; value: string }>) =>
    apiRequest<Record<string, unknown>>(`/projects/${projectId}/environment`, { method: 'POST', body: JSON.stringify({ envVars }) }),
  archive: (projectId: string) => apiRequest<Record<string, unknown>>(`/projects/${projectId}/archive`, { method: 'PATCH' }),
  remove: (projectId: string) => apiRequest<Record<string, unknown>>(`/projects/${projectId}`, { method: 'DELETE' })
};

export const deploymentApi = {
  list: (projectId: string) => apiRequest<Array<Record<string, unknown>>>(`/deployments?projectId=${encodeURIComponent(projectId)}`),
  getById: (deploymentId: string) => apiRequest<Record<string, unknown>>(`/deployments/${deploymentId}`),
  getStatus: (deploymentId: string) => apiRequest<{ status: string; steps: any[] }>(`/deployments/${deploymentId}/status`),
  create: (body: { projectId: string; branch?: string; commitSha?: string }) =>
    apiRequest<Record<string, unknown>>('/deployments', { method: 'POST', body: JSON.stringify(body) }),
  logs: (deploymentId: string, query = '') => apiRequest<Array<Record<string, unknown>>>(`/deployments/${deploymentId}/logs${query ? `?${query}` : ''}`),
  retry: (deploymentId: string) => apiRequest<Record<string, unknown>>(`/deployments/${deploymentId}/retry`, { method: 'POST' }),
  cancel: (deploymentId: string) => apiRequest<Record<string, unknown>>(`/deployments/${deploymentId}/cancel`, { method: 'POST' }),
  rollback: (deploymentId: string) => apiRequest<Record<string, unknown>>(`/deployments/${deploymentId}/rollback`, { method: 'POST' }),
  analytics: (projectId?: string) => apiRequest<Record<string, unknown>>(`/deployments/analytics${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`),
  error: (deploymentId: string) => apiRequest<Record<string, unknown>>(`/deployments/${deploymentId}/error`)
};

export const analyticsApi = {
  get: () => apiRequest<Record<string, unknown>>('/analytics')
};

export const monitoringApi = {
  get: () => apiRequest<Record<string, unknown>>('/monitoring')
};

export const notificationApi = {
  list: () => apiRequest<Array<Record<string, unknown>>>('/notifications')
};

export const aiApi = {
  getDiagnosis: (deploymentId: string) => apiRequest<Record<string, unknown>>(`/ai/diagnosis/${deploymentId}`),
};

export { setTokens, clearTokens, getAccessToken };
