import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useProjects } from '../../context/ProjectContext';
import { deploymentApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface PipelineStep {
  name: string;
  status: 'Pending' | 'Building' | 'Running' | 'Healthy' | 'Failed' | 'Warning';
  detail?: string;
}

interface LogEntry {
  id: string;
  time: string;
  level: string;
  message: string;
}

const TIMELINE_STEPS = [
  'Queued',
  'Initializing',
  'Downloading',
  'Installing',
  'Building',
  'Starting',
  'Health Check',
  'Completed'
];

export const DeploymentProgressPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { triggerToast, projects } = useProjects();
  const terminalRef = useRef<HTMLDivElement>(null);

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';
  const deploymentIdFromQuery = queryParams.get('deploymentId') || '';

  const [deploymentId, setDeploymentId] = useState(deploymentIdFromQuery);
  const [status, setStatus] = useState<string>('Pending');
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [healthUrl, setHealthUrl] = useState<string>('');
  const [buildDurationMs, setBuildDurationMs] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const project = useMemo(
    () => projects.find((p) => String(p._id || p.id) === projectId),
    [projectId, projects]
  );

  const fetchDeploymentDetails = async () => {
    try {
      if (!projectId) return;
      const listRes = await deploymentApi.list(projectId);
      const list = listRes.data || [];

      const current = deploymentId
        ? list.find((item) => String(item._id || item.id) === deploymentId)
        : list[0];

      if (current) {
        const curId = String(current._id || current.id);
        setDeploymentId(curId);
        setStatus(String(current.status || 'Pending'));
        setHealthUrl(current.healthUrl ? String(current.healthUrl) : '');
        setBuildDurationMs(Number(current.buildDurationMs || 0));

        if (Array.isArray(current.steps) && current.steps.length > 0) {
          setSteps(
            current.steps.map((s: any) => ({
              name: String(s.name || 'Step'),
              status: s.status || 'Pending',
              detail: s.detail ? String(s.detail) : ''
            }))
          );
        } else {
          setSteps(TIMELINE_STEPS.map((name, i) => ({ name, status: i === 0 ? 'Building' : 'Pending' })));
        }

        // Fetch logs
        try {
          const logRes = await deploymentApi.logs(curId);
          if (Array.isArray(logRes.data)) {
            setLogs(
              logRes.data.map((l: any) => ({
                id: String(l._id || l.id || Math.random()),
                time: new Date(String(l.createdAt || new Date())).toLocaleTimeString(),
                level: String(l.level || 'info'),
                message: String(l.message || '')
              }))
            );
          }
        } catch (_) {}
      }
    } catch (err) {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDeploymentDetails();
    const timer = setInterval(() => {
      if (status !== 'Healthy' && status !== 'Failed' && status !== 'Cancelled') {
        void fetchDeploymentDetails();
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [projectId, deploymentId, status]);

  // Connect Socket.IO for live logs & timeline status changes
  useEffect(() => {
    if (!deploymentId) return;

    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      socket.emit('subscribe:deployment', { deploymentId });
    });

    socket.on('deployment:log', (logEntry: any) => {
      setLogs((prev) => [
        ...prev,
        {
          id: String(logEntry._id || Math.random()),
          time: new Date(String(logEntry.createdAt || new Date())).toLocaleTimeString(),
          level: String(logEntry.level || 'info'),
          message: String(logEntry.message || '')
        }
      ]);
    });

    socket.on('deployment:status', (payload: any) => {
      if (payload.status) setStatus(payload.status);
      if (Array.isArray(payload.steps)) {
        setSteps(
          payload.steps.map((s: any) => ({
            name: String(s.name),
            status: s.status,
            detail: s.detail || ''
          }))
        );
      }
    });

    return () => {
      socket.emit('unsubscribe:deployment', { deploymentId });
      socket.disconnect();
    };
  }, [deploymentId]);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRedeploy = async () => {
    if (!deploymentId) return;
    try {
      setActionLoading(true);
      const res = await deploymentApi.retry(deploymentId);
      triggerToast('Redeployment triggered!', 'success');
      const newId = String(res.data._id || res.data.id);
      setDeploymentId(newId);
      navigate(`/deployment?projectId=${projectId}&deploymentId=${newId}`);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Redeploy failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!deploymentId) return;
    try {
      setActionLoading(true);
      await deploymentApi.cancel(deploymentId);
      setStatus('Cancelled');
      triggerToast('Deployment cancelled', 'info');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Cancel failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!deploymentId) return;
    try {
      setActionLoading(true);
      const res = await deploymentApi.rollback(deploymentId);
      triggerToast('Rollback executed successfully!', 'success');
      const newId = String(res.data._id || res.data.id);
      setDeploymentId(newId);
      navigate(`/deployment?projectId=${projectId}&deploymentId=${newId}`);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Rollback failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const completedStepsCount = steps.filter((s) => s.status === 'Healthy').length;
  const progressPercentage = steps.length ? Math.round((completedStepsCount / steps.length) * 100) : 0;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Healthy':
      case 'Success':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Success 🟢</span>;
      case 'Running':
      case 'Building':
      case 'Deploying':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">Building / Deploying ⚡</span>;
      case 'Pending':
      case 'Queued':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Queued ⏳</span>;
      case 'Cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">Cancelled ⏹️</span>;
      case 'Failed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">Failed 🔴</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">{st}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-7xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading flex items-center gap-3">
            Deploy Dashboard: <span className="text-primary">{project?.name || 'Project'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live build engine, real-time terminal output, and status timeline.</p>
        </div>

        <div className="flex items-center gap-2">
          {status === 'Healthy' && (
            <Button variant="primary" size="sm" onClick={handleRollback} isLoading={actionLoading}>
              ⏪ Rollback
            </Button>
          )}
          {(status === 'Running' || status === 'Building' || status === 'Pending') && (
            <Button variant="secondary" size="sm" onClick={handleCancel} isLoading={actionLoading} className="text-slate-300 hover:text-white">
              ⏹️ Cancel
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleRedeploy} isLoading={actionLoading}>
            🔄 Redeploy Now
          </Button>
        </div>
      </div>

      {/* Main Deployment Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Columns: 8-Step Timeline Stepper */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="p-6 border border-white/6 flex flex-col gap-5">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 font-heading">Deployment Timeline</span>
              {getStatusBadge(status)}
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    status === 'Failed' ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-emerald-400'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Step Stepper List */}
            <div className="flex flex-col gap-4 mt-2">
              {(steps.length ? steps : TIMELINE_STEPS.map((n, i) => ({ name: n, status: i === 0 ? 'Building' : 'Pending' }))).map((step, idx) => {
                const isHealthy = step.status === 'Healthy';
                const isCurrent = step.status === 'Building' || step.status === 'Running';
                const isFailed = step.status === 'Failed';
                const isPending = !isHealthy && !isCurrent && !isFailed;

                return (
                  <div key={step.name} className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center border font-bold text-xs transition-all ${
                        isHealthy ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                        isCurrent ? 'bg-primary/20 border-primary text-white animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.3)]' :
                        isFailed ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                        'bg-white/3 border-white/8 text-slate-500'
                      }`}>
                        {isHealthy && '✓'}
                        {isCurrent && '⚡'}
                        {isFailed && '✕'}
                        {isPending && (idx + 1)}
                      </div>
                      {idx < (steps.length || TIMELINE_STEPS.length) - 1 && (
                        <div className={`w-[2px] h-6 my-1 transition-all ${isHealthy ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          isHealthy ? 'text-white' :
                          isCurrent ? 'text-primary' :
                          isFailed ? 'text-red-400' : 'text-slate-500'
                        }`}>
                          {step.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono capitalize">{step.status}</span>
                      </div>
                      {step.detail && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{step.detail}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right 7 Columns: Railway-Style Live Terminal Console */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Metadata Bar Card */}
          <Card className="p-4 border border-white/6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Framework</span>
              <span className="text-white font-semibold">{project?.framework || 'Node.js'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Branch</span>
              <span className="text-white font-semibold font-mono">{project?.defaultBranch || 'main'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Build Time</span>
              <span className="text-white font-semibold font-mono">{buildDurationMs ? `${(buildDurationMs / 1000).toFixed(1)}s` : 'In Progress'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Endpoint URL</span>
              {healthUrl ? (
                <a href={healthUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-semibold font-mono hover:underline truncate block">
                  {healthUrl} ↗
                </a>
              ) : (
                <span className="text-slate-500 italic">Not Deployed</span>
              )}
            </div>
          </Card>

          {/* Live Terminal Log Stream Card */}
          <Card className="p-0 border border-white/8 bg-slate-950 overflow-hidden flex flex-col rounded-2xl shadow-2xl">
            <div className="bg-slate-900/90 border-b border-white/6 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 font-mono">Live Build Terminal</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{logs.length} lines logged</span>
            </div>

            <div
              ref={terminalRef}
              className="p-5 font-mono text-[11px] leading-relaxed h-[420px] overflow-y-auto flex flex-col gap-1 text-slate-300"
            >
              {logs.map((l) => {
                const isErr = l.level === 'error' || l.message.includes('[stderr]') || l.message.includes('Error');
                const isWarn = l.level === 'warn';
                const isSuccess = l.message.includes('✓') || l.message.includes('Passed') || l.message.includes('successfully');

                return (
                  <div key={l.id} className="flex items-start gap-3 hover:bg-white/2 py-0.5 px-1 rounded transition">
                    <span className="text-slate-600 select-none text-[10px]">{l.time}</span>
                    <span className={isErr ? 'text-red-400 font-semibold' : isWarn ? 'text-amber-400' : isSuccess ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                      {l.message}
                    </span>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="text-slate-600 text-center py-20 italic">
                  Initializing socket connection... Logs will stream here live.
                </div>
              )}
            </div>
          </Card>

          {/* Doctor Diagnostic Link if failed */}
          {status === 'Failed' && (
            <Link
              to={`/doctor?projectId=${projectId}&deploymentId=${deploymentId}`}
              className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/30 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🩺</span>
                <div>
                  <span className="text-xs font-bold block text-white">Deployment Failed — Run AI Doctor Diagnosis</span>
                  <span className="text-[11px] text-indigo-300">Click to automatically analyze root cause and generated fix.</span>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-400">Diagnose →</span>
            </Link>
          )}

        </div>

      </div>
    </div>
  );
};
