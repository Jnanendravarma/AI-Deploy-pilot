import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { deploymentApi } from '../../services/api';
import { Card } from '../../components/ui/Card';

interface PipelineStep {
  name: string;
  status: string;
  detail?: string;
}

export const DeploymentProgressPage: React.FC = () => {
  const location = useLocation();
  const { triggerToast, projects } = useProjects();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';
  const deploymentIdFromQuery = queryParams.get('deploymentId') || '';

  const [deploymentId, setDeploymentId] = useState(deploymentIdFromQuery);
  const [status, setStatus] = useState('Pending');
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [loading, setLoading] = useState(true);

  const projectName = useMemo(
    () => projects.find((project) => project.id === projectId)?.name || 'project',
    [projectId, projects]
  );

  useEffect(() => {
    let interval: number | undefined;

    const load = async () => {
      try {
        setLoading(true);
        const list = await deploymentApi.list(projectId);
        const deployments = list.data;
        const current = deploymentId
          ? deployments.find((item) => String(item._id) === deploymentId)
          : deployments[0];

        if (!current) {
          setSteps([]);
          setStatus('Pending');
          return;
        }

        setDeploymentId(String(current._id));
        setStatus(String(current.status || 'Pending'));

        const rawSteps = Array.isArray(current.steps) ? current.steps : [];
        setSteps(
          rawSteps.map((step) => {
            const safe = step as Record<string, unknown>;
            return {
              name: String(safe.name || 'Unknown'),
              status: String(safe.status || 'Pending'),
              detail: safe.detail ? String(safe.detail) : undefined
            };
          })
        );
      } catch (error) {
        triggerToast(error instanceof Error ? error.message : 'Failed to fetch deployment', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
    interval = window.setInterval(() => {
      void load();
    }, 3000);

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [deploymentId, projectId, triggerToast]);

  const completedCount = steps.filter((step) => step.status === 'Healthy').length;
  const progressPercent = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;
  const pipelineFailed = status === 'Failed';

  return (
    <div className="flex flex-col gap-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-heading">Deployment Pipeline for <span className="text-gradient-purple">{projectName}</span></h1>
          <p className="text-xs text-slate-500 mt-1">Live deployment status from backend pipeline worker.</p>
        </div>
        <div className="flex items-center gap-3">
          {deploymentId && (
            <Link to={`/logs?projectId=${projectId}&deploymentId=${deploymentId}`} className="inline-flex items-center justify-center font-semibold rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/8 px-4 py-2 text-xs transition-all duration-200">
              View Live Logs
            </Link>
          )}
          {pipelineFailed && deploymentId && (
            <Link to={`/doctor?projectId=${projectId}&deploymentId=${deploymentId}`} className="inline-flex items-center justify-center font-semibold rounded-xl bg-indigo-950/20 text-indigo-400 hover:bg-indigo-900 border border-indigo-500/30 px-4 py-2 text-xs transition-all duration-200 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              Open Deployment Doctor
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card className="p-8 border border-white/6 flex flex-col gap-6">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className={pipelineFailed ? 'text-red-400' : progressPercent === 100 ? 'text-emerald-400' : 'text-primary'}>
                {loading ? 'Loading deployment status...' : `Current status: ${status}`}
              </span>
              <span className="text-slate-400">{progressPercent}%</span>
            </div>

            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-6">
              <div
                className={`h-full transition-all duration-500 ${pipelineFailed ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-accent'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-col gap-6">
              {steps.map((step, idx) => {
                const isCompleted = step.status === 'Healthy';
                const isRunning = step.status === 'Building' || step.status === 'Running';
                const isFailed = step.status === 'Failed';
                const isPending = !isCompleted && !isRunning && !isFailed;

                return (
                  <div key={`${step.name}-${idx}`} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-xs ${
                        isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        isRunning ? 'bg-primary/10 border-primary text-primary animate-pulse' :
                        isFailed ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-white/1 border-white/5 text-slate-500'
                      }`}>
                        {isCompleted && '✓'}
                        {isRunning && '•'}
                        {isFailed && '✕'}
                        {isPending && (idx + 1)}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-[1px] h-10 my-1 ${isCompleted ? 'bg-emerald-500/20' : 'bg-white/5'}`} />
                      )}
                    </div>

                    <div className="flex flex-col leading-normal">
                      <span className={`text-xs font-bold font-heading ${
                        isCompleted ? 'text-white' :
                        isRunning ? 'text-primary' :
                        isFailed ? 'text-red-400' : 'text-slate-500'
                      }`}>
                        {step.name}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[500px]">{step.detail || 'Awaiting update from worker'}</p>
                    </div>
                  </div>
                );
              })}
              {!loading && steps.length === 0 && (
                <p className="text-xs text-slate-500">No deployment steps available yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-6 border border-white/6 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 font-heading">Deployment Details</h3>
            <div className="flex flex-col gap-2 border-t border-white/4 pt-3 text-[10px] text-slate-400 leading-normal">
              <div className="flex items-center justify-between">
                <span>Deployment ID</span>
                <span className="text-slate-200 font-mono">{deploymentId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Project ID</span>
                <span className="text-slate-200 font-mono">{projectId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="text-slate-200">{status}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
