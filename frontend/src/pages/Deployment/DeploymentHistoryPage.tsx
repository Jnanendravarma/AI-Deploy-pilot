import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { deploymentApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const DeploymentHistoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { triggerToast, projects } = useProjects();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';

  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const project = projects.find((p) => String(p._id || p.id) === projectId);

  const fetchHistory = async () => {
    try {
      if (!projectId) return;
      setLoading(true);
      const res = await deploymentApi.list(projectId);
      setDeployments(res.data || []);
    } catch (err) {
      triggerToast('Failed to load deployment history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, [projectId]);

  const handleRedeploy = async (deploymentId: string) => {
    try {
      setActionLoadingId(deploymentId);
      const res = await deploymentApi.retry(deploymentId);
      triggerToast('Redeploy launched!', 'success');
      const newId = String(res.data._id || res.data.id);
      navigate(`/deployment?projectId=${projectId}&deploymentId=${newId}`);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Redeploy failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    try {
      setActionLoadingId(deploymentId);
      const res = await deploymentApi.rollback(deploymentId);
      triggerToast('Rollback executed!', 'success');
      const newId = String(res.data._id || res.data.id);
      navigate(`/deployment?projectId=${projectId}&deploymentId=${newId}`);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Rollback failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">
            Deployment History: <span className="text-primary">{project?.name || 'Project'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Audit log of all build executions, commits, and rollbacks.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>

      <Card className="p-0 border border-white/6 overflow-hidden">
        <div className="bg-slate-900 border-b border-white/6 px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 font-heading">Total Executions: {deployments.length}</span>
          <Button variant="secondary" size="sm" onClick={fetchHistory}>
            🔄 Refresh History
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading history...</div>
        ) : deployments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 italic">No deployments found for this project yet.</div>
        ) : (
          <div className="divide-y divide-white/6">
            {deployments.map((d, idx) => {
              const dId = String(d._id || d.id);
              const num = deployments.length - idx;
              const isHealthy = d.status === 'Healthy' || d.status === 'Success';
              const isFailed = d.status === 'Failed';

              return (
                <div key={dId} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/2 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/8 flex items-center justify-center font-bold text-xs text-slate-300 font-mono">
                      #{num}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">Deployment #{num}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isHealthy ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          isFailed ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Branch: <code className="text-slate-200">{d.branch || 'main'}</code></span>
                        <span>•</span>
                        <span>Commit: <code className="text-slate-200">{d.commitSha || 'latest'}</code></span>
                        <span>•</span>
                        <span>Duration: {d.buildDurationMs ? `${(d.buildDurationMs / 1000).toFixed(1)}s` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/logs?projectId=${projectId}&deploymentId=${dId}`}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/8 transition"
                    >
                      View Logs
                    </Link>
                    {isHealthy && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionLoadingId === dId}
                        onClick={() => handleRollback(dId)}
                      >
                        Rollback
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={actionLoadingId === dId}
                      onClick={() => handleRedeploy(dId)}
                    >
                      Redeploy
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
