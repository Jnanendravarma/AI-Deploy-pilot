import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  analyticsApi,
  authApi,
  clearTokens,
  deploymentApi,
  getAccessToken,
  monitoringApi,
  notificationApi,
  projectApi,
  setTokens
} from '../services/api';
import { supabase } from '../lib/supabase';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'user' | 'developer' | 'admin' | 'team_owner' | 'organization_admin' | string;
  avatar?: string;
}

export interface Project {
  _id: string;
  id: string; // convenience mapping to match MongoDB _id
  name: string;
  framework: string;
  language?: string;
  repositoryUrl?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  commit: string;
  branch: string;
  domains: string[];
  activeDeploymentId: string;
  metadata?: Record<string, any>;
  envVars?: Array<{ key: string; value: string }>;
}

export interface Deployment {
  _id: string;
  projectId: string;
  status: 'Pending' | 'Building' | 'Running' | 'Healthy' | 'Warning' | 'Failed' | 'Stopped' | 'Cancelled';
  branch?: string;
  commitSha?: string;
  imageTag?: string;
  buildDurationMs?: number;
  createdAt: string;
  updatedAt: string;
  steps?: Array<{ name: string; status: string; detail?: string }>;
}

export interface Incident {
  id: string;
  time: string;
  project: string;
  issue: string;
  description: string;
  status: 'Healed' | 'Offline' | 'Active';
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ProjectContextType {
  user: UserSession | null;
  loadingUser: boolean;
  projects: Project[];
  deploymentsByProject: Record<string, Deployment[]>;
  incidents: Incident[];
  analytics: Record<string, any> | null;
  monitoring: Record<string, any> | null;
  notifications: Array<Record<string, any>>;
  loading: boolean;
  loadingProjects: boolean;
  loadingAnalytics: boolean;
  error: string | null;
  toasts: Toast[];
  triggerToast: (message: string, type?: 'success' | 'error') => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  addProject: (name: string, framework: string, envs: { key: string; value: string }[]) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  addDomainToProject: (projectName: string, domain: string) => void;
  updateProjectSettings: (projectId: string, payload: Record<string, any>) => Promise<void>;
  createDeploymentForProject: (projectId: string) => Promise<Deployment>;
  loadDeploymentLogs: (deploymentId: string, query?: string) => Promise<Array<Record<string, any>>>;
  retryDeployment: (deploymentId: string) => Promise<Deployment>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function parseApiProject(payload: Record<string, any>): Project {
  const metadata = payload.metadata || {};
  return {
    _id: String(payload._id),
    id: String(payload._id),
    name: String(payload.name || ''),
    framework: String(payload.framework || 'Unknown'),
    language: payload.language ? String(payload.language) : undefined,
    repositoryUrl: payload.repositoryUrl ? String(payload.repositoryUrl) : undefined,
    archived: Boolean(payload.archived),
    createdAt: String(payload.createdAt || new Date().toISOString()),
    updatedAt: String(payload.updatedAt || new Date().toISOString()),
    commit: String(metadata.lastCommit || metadata.commitSha || 'N/A'),
    branch: String(payload.defaultBranch || 'main'),
    domains: Array.isArray(metadata.domains) ? metadata.domains : [],
    activeDeploymentId: String(metadata.activeDeploymentId || ''),
    metadata,
    envVars: payload.envVars || []
  };
}

function parseApiDeployment(payload: Record<string, any>): Deployment {
  return {
    _id: String(payload._id),
    projectId: String(payload.projectId),
    status: String(payload.status || 'Pending') as Deployment['status'],
    branch: payload.branch ? String(payload.branch) : undefined,
    commitSha: payload.commitSha ? String(payload.commitSha) : undefined,
    imageTag: payload.imageTag ? String(payload.imageTag) : undefined,
    buildDurationMs: payload.buildDurationMs ? Number(payload.buildDurationMs) : 0,
    createdAt: String(payload.createdAt || new Date().toISOString()),
    updatedAt: String(payload.updatedAt || new Date().toISOString()),
    steps: Array.isArray(payload.steps)
      ? payload.steps.map((step) => {
          const safe = step as Record<string, any>;
          return {
            name: String(safe.name || ''),
            status: String(safe.status || 'Pending'),
            detail: safe.detail ? String(safe.detail) : undefined
          };
        })
      : []
  };
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  // 1. User query with Supabase profiles auto-creation
  const { data: user = null, isLoading: loadingUser, refetch: refetchUser } = useQuery<UserSession | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await authApi.me();
          const userPayload = res.data.user;
          return {
            userId: String(userPayload.userId),
            name: String(userPayload.name),
            email: String(userPayload.email),
            role: String(userPayload.role),
            avatar: userPayload.avatar ? String(userPayload.avatar) : undefined
          };
        } catch {
          // Token invalid or failed; fallback to Supabase session check below
        }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const suUser = session.user;
          const suId = suUser.id;
          const suEmail = suUser.email || '';
          const suName = suUser.user_metadata?.full_name || suUser.user_metadata?.name || suUser.email?.split('@')[0] || 'developer';
          const suAvatar = suUser.user_metadata?.avatar_url || suUser.user_metadata?.picture || '';
          const suProvider = suUser.app_metadata?.provider || 'github';

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', suId)
              .maybeSingle();

            if (!profile) {
              const newProfile = {
                id: suId,
                full_name: suName,
                avatar_url: suAvatar,
                email: suEmail,
                provider: suProvider,
                role: 'developer',
                updated_at: new Date().toISOString()
              };
              await supabase.from('profiles').insert(newProfile);
              return {
                userId: suId,
                name: suName,
                email: suEmail,
                role: 'developer',
                avatar: suAvatar
              };
            }

            return {
              userId: profile.id,
              name: profile.full_name || suName,
              email: profile.email || suEmail,
              role: profile.role || 'developer',
              avatar: profile.avatar_url || suAvatar
            };
          } catch {
            return {
              userId: suId,
              name: suName,
              email: suEmail,
              role: 'developer',
              avatar: suAvatar
            };
          }
        }
      } catch {
        // Ignored
      }

      return null;
    }
  });

  // 2. Projects query
  const { data: projects = [], isLoading: loadingProjects, refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!getAccessToken()) return [];
      try {
        const res = await projectApi.list();
        return res.data.map(parseApiProject);
      } catch {
        return [];
      }
    },
    enabled: !!user
  });

  // 3. Deployments query
  const projectIdsString = projects.map(p => p._id).join(',');
  const { data: deploymentsByProject = {}, isLoading: loadingDeployments, refetch: refetchDeployments } = useQuery<Record<string, Deployment[]>>({
    queryKey: ['deployments', projectIdsString],
    queryFn: async () => {
      if (!getAccessToken() || projects.length === 0) return {};
      try {
        const deploymentEntries = await Promise.all(
          projects.map(async (project) => {
            const deploymentsRes = await deploymentApi.list(project._id);
            return [project._id, deploymentsRes.data.map(parseApiDeployment)] as const;
          })
        );
        return Object.fromEntries(deploymentEntries);
      } catch {
        return {};
      }
    },
    enabled: projects.length > 0
  });

  // 4. Analytics query
  const { data: analytics = null, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useQuery<Record<string, any> | null>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!getAccessToken()) return null;
      try {
        const res = await analyticsApi.get();
        return res.data;
      } catch {
        return {
          totalDeployments: 0,
          successRate: 100,
          averageBuildTimeMs: 45000,
          failureRate: 0
        };
      }
    },
    enabled: !!user
  });

  // 5. Monitoring query
  const { data: monitoring = null, refetch: refetchMonitoring } = useQuery<Record<string, any> | null>({
    queryKey: ['monitoring'],
    queryFn: async () => {
      if (!getAccessToken()) return null;
      try {
        const res = await monitoringApi.get();
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  // 6. Notifications query
  const { data: notifications = [], refetch: refetchNotifications } = useQuery<Array<Record<string, any>>>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!getAccessToken()) return [];
      try {
        const res = await notificationApi.list();
        return res.data;
      } catch {
        return [];
      }
    },
    enabled: !!user
  });

  // Automatically detect OAuth redirect tokens in URL or Supabase Auth changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      const url = new URL(window.location.href);
      url.searchParams.delete('accessToken');
      url.searchParams.delete('refreshToken');
      window.history.replaceState({}, document.title, url.pathname + url.search);
      refreshWorkspace();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        refreshWorkspace();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Calculate incidents dynamically from deployments
  const incidents = useMemo(() => {
    const derived: Incident[] = [];
    Object.entries(deploymentsByProject).forEach(([projectId, deployments]) => {
      const project = projects.find((item) => item._id === projectId);
      if (!project) return;

      deployments
        .filter((deployment) => deployment.status === 'Failed' || deployment.status === 'Warning')
        .slice(0, 6)
        .forEach((deployment) => {
          derived.push({
            id: deployment._id,
            time: new Date(deployment.updatedAt).toLocaleString(),
            project: project.name,
            issue: deployment.status === 'Failed' ? 'Deployment failure' : 'Deployment warning',
            description: deployment.steps?.find((step) => step.status === 'Failed' || step.status === 'Warning')?.detail ||
              `Pipeline status is ${deployment.status}`,
            status: deployment.status === 'Failed' ? 'Offline' : 'Active'
          });
        });
    });
    return derived;
  }, [deploymentsByProject, projects]);

  const refreshWorkspace = async () => {
    queryClient.clear();
    const uResult = await refetchUser();
    if (uResult.data) {
      await Promise.all([
        refetchProjects(),
        refetchDeployments(),
        refetchAnalytics(),
        refetchMonitoring(),
        refetchNotifications()
      ]);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setTokens(response.data.accessToken, response.data.refreshToken);
      queryClient.clear();
      await refetchUser();
      triggerToast('Welcome back', 'success');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Login failed';
      throw new Error(message);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.register({ name, email, password });
      setTokens(response.data.accessToken, response.data.refreshToken);
      queryClient.clear();
      await refetchUser();
      triggerToast('Workspace prepared! Welcome', 'success');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Signup failed';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignored
    }
    clearTokens();
    queryClient.clear();
    triggerToast('Logged out successfully', 'success');
  };

  const addProject = async (name: string, framework: string, envs: { key: string; value: string }[]) => {
    const response = await projectApi.create({
      name: name.toLowerCase().trim(),
      repositoryProvider: 'manual',
      packageJson: {},
      fileNames: ['package.json'],
      envVars: envs,
      frameworkHint: framework
    });

    const project = parseApiProject(response.data);
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    triggerToast(`Project created: ${project.name}`, 'success');
    return project.id;
  };

  const deleteProject = async (projectId: string) => {
    await projectApi.remove(projectId);
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    await queryClient.invalidateQueries({ queryKey: ['deployments'] });
    triggerToast('Project deleted', 'success');
  };

  const addDomainToProject = (_projectName: string, _domain: string) => {
    triggerToast('Domain binding is updated under settings dashboard.', 'success');
  };

  const updateProjectSettings = async (projectId: string, payload: Record<string, any>) => {
    await projectApi.update(projectId, payload);
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    triggerToast('Project settings synchronized', 'success');
  };

  const createDeploymentForProject = async (projectId: string) => {
    const response = await deploymentApi.create({ projectId });
    const deployment = parseApiDeployment(response.data);
    await queryClient.invalidateQueries({ queryKey: ['deployments'] });
    triggerToast('Deployment queued', 'success');
    return deployment;
  };

  const loadDeploymentLogs = async (deploymentId: string, query = '') => {
    const response = await deploymentApi.logs(deploymentId, query);
    return response.data;
  };

  const retryDeployment = async (deploymentId: string) => {
    const response = await deploymentApi.retry(deploymentId);
    const deployment = parseApiDeployment(response.data);
    await queryClient.invalidateQueries({ queryKey: ['deployments'] });
    triggerToast('Deployment retry queued', 'success');
    return deployment;
  };

  const value = useMemo<ProjectContextType>(() => ({
    user,
    loadingUser,
    projects,
    deploymentsByProject,
    incidents,
    analytics,
    monitoring,
    notifications,
    loading: loadingProjects || loadingDeployments || loadingAnalytics,
    loadingProjects,
    loadingAnalytics,
    error: null,
    toasts,
    triggerToast,
    login,
    signup,
    logout,
    refreshWorkspace,
    addProject,
    deleteProject,
    addDomainToProject,
    updateProjectSettings,
    createDeploymentForProject,
    loadDeploymentLogs,
    retryDeployment
  }), [
    user,
    loadingUser,
    projects,
    deploymentsByProject,
    incidents,
    analytics,
    monitoring,
    notifications,
    loadingProjects,
    loadingDeployments,
    loadingAnalytics,
    toasts
  ]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
