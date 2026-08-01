import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjects } from '../../context/ProjectContext';
import { aiApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Gauge,
  History,
  Rocket,
  ShieldAlert,
  Sparkles,
  Wrench,
  ListChecks
} from 'lucide-react';

function toText(value: unknown, fallback = '—') {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function toArray(value: unknown): Array<Record<string, any>> {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function severityTone(severity?: string) {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
      return 'text-rose-300 border-rose-500/20 bg-rose-500/8';
    case 'high':
      return 'text-orange-300 border-orange-500/20 bg-orange-500/8';
    case 'medium':
      return 'text-amber-300 border-amber-500/20 bg-amber-500/8';
    case 'low':
      return 'text-emerald-300 border-emerald-500/20 bg-emerald-500/8';
    default:
      return 'text-slate-300 border-white/10 bg-white/5';
  }
}

export const DoctorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { projects, deploymentsByProject } = useProjects();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';
  const deploymentId = queryParams.get('deploymentId') || '';

  const project = projects.find((item) => item._id === projectId) || projects[0] || null;
  const projectDeployments = project ? (deploymentsByProject[project._id] || []) : [];
  const deployment = deploymentId
    ? projectDeployments.find((item) => item._id === deploymentId) || null
    : projectDeployments[0] || null;

  const activeProjectId = project?._id || '';
  const activeDeploymentId = deployment?._id || deploymentId || '';
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const { data: diagnosisPayload, isLoading } = useQuery<Record<string, any> | null>({
    queryKey: ['aiDiagnosis', activeDeploymentId],
    queryFn: async () => {
      if (!activeDeploymentId) return null;
      const res = await aiApi.getDiagnosis(activeDeploymentId);
      return res.data;
    },
    enabled: !!activeDeploymentId
  });

  const { data: historyPayload = [] } = useQuery<Array<Record<string, any>>>({
    queryKey: ['aiHistory', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const res = await aiApi.getHistory(activeProjectId);
      return res.data;
    },
    enabled: !!activeProjectId
  });

  const { data: recommendationsPayload = [] } = useQuery<Array<Record<string, any>>>({
    queryKey: ['aiRecommendations', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const res = await aiApi.getRecommendations(activeProjectId);
      return res.data;
    },
    enabled: !!activeProjectId
  });

  const { data: reportPayload } = useQuery<Record<string, any> | null>({
    queryKey: ['aiReport', activeProjectId, activeDeploymentId],
    queryFn: async () => {
      if (!activeProjectId) return null;
      const res = await aiApi.getReport(activeProjectId, activeDeploymentId || undefined);
      return res.data;
    },
    enabled: !!activeProjectId
  });

  const { data: securityPayload } = useQuery<Record<string, any> | null>({
    queryKey: ['aiSecurityScan', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return null;
      const res = await aiApi.getSecurityScan(activeProjectId);
      return res.data;
    },
    enabled: !!activeProjectId
  });

  const { data: performancePayload } = useQuery<Record<string, any> | null>({
    queryKey: ['aiPerformanceScan', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return null;
      const res = await aiApi.getPerformanceScan(activeProjectId);
      return res.data;
    },
    enabled: !!activeProjectId
  });

  const diagnosis = diagnosisPayload || {};
  const report = reportPayload || {};
  const security = securityPayload || {};
  const performance = performancePayload || {};
  const history = Array.isArray(historyPayload) ? historyPayload : [];
  const recommendations = Array.isArray(recommendationsPayload) ? recommendationsPayload : [];
  const timeline = deployment?.steps || [];
  const topRecommendation = recommendations[0];
  const confidence = Number(diagnosis.confidenceScore || 0);
  const healthScore = Number(report.healthScore || performance.healthScore || 0);
  const severity = String(diagnosis.severity || deployment?.status || 'Medium');
  const errorType = String(diagnosis.errorType || 'Deployment Failure');
  const rootCause = String(diagnosis.rootCause || 'No diagnosis has been generated yet.');
  const explanation = String(diagnosis.humanExplanation || 'Run AI analysis to generate a human-friendly explanation.');
  const estimatedFixTime = String(diagnosis.estimatedFixTime || '2 mins');
  const autoFixable = Boolean(diagnosis.autoFixable);
  const suggestedFixes = toArray(diagnosis.suggestedFixes);
  const latestHistory = history.slice(0, 4);
  const securityFindings = toArray(security.findings);
  const performanceRecommendations = toArray(performance.recommendations);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!activeDeploymentId) throw new Error('Select a deployment first');
      const res = await aiApi.analyze(activeDeploymentId);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['aiDiagnosis', activeDeploymentId] }),
        queryClient.invalidateQueries({ queryKey: ['aiHistory', activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['aiReport', activeProjectId, activeDeploymentId] })
      ]);
    }
  });

  const applyFixMutation = useMutation({
    mutationFn: async () => {
      if (!activeProjectId || !activeDeploymentId) throw new Error('Missing deployment context');
      const autoFixAction = diagnosis.autoFixAction || { type: 'install_dep', package: 'axios' };
      const res = await aiApi.fix({
        projectId: activeProjectId,
        deploymentId: activeDeploymentId,
        fixAction: autoFixAction as Record<string, unknown>
      });
      return res.data;
    },
    onSuccess: async (result: Record<string, any>) => {
      const nextDeploymentId = String(result?.newDeploymentId || '');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['aiHistory', activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['aiDiagnosis', activeDeploymentId] })
      ]);
      if (nextDeploymentId) {
        navigate(`/deployment?projectId=${activeProjectId}&deploymentId=${nextDeploymentId}`);
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
        Loading AI Doctor...
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
          <Bot className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-white">No project selected</h2>
        <p className="mt-2 text-sm text-slate-400">Open a project with deployments to inspect its AI diagnostics.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Deployment Doctor
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">AI Deployment Doctor</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Diagnose failed deployments, explain root causes in plain language, and apply safe fixes from a single dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Project: {project.name}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Deployment: {activeDeploymentId ? activeDeploymentId.slice(0, 8) : 'none'}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Framework: {toText(project.framework, 'Unknown')}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate(`/ai-chat?deploymentId=${activeDeploymentId}&projectId=${activeProjectId}`)}>
              Ask AI
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="primary" onClick={() => analyzeMutation.mutate()} isLoading={analyzeMutation.isPending} disabled={!activeDeploymentId}>
              Run Analysis
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/projects/${activeProjectId}/deployments`)}>
              Deployments
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Project Status</p>
              <p className="mt-2 text-2xl font-bold text-white">{toText(deployment?.status, 'Pending')}</p>
            </div>
            <StatusBadge status={deployment?.status || 'Offline'} />
          </div>
        </Card>

        <Card className="border-white/8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Error Type</p>
          <div className="mt-2 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
            <p className="text-lg font-semibold text-white">{errorType}</p>
          </div>
        </Card>

        <Card className="border-white/8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI Confidence</p>
          <div className="mt-2 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <p className="text-lg font-semibold text-white">{confidence ? `${confidence}%` : 'Pending'}</p>
          </div>
        </Card>

        <Card className="border-white/8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deployment Health</p>
          <div className="mt-2 flex items-center gap-3">
            <Gauge className="h-5 w-5 text-cyan-300" />
            <p className="text-lg font-semibold text-white">{healthScore ? `${healthScore}/100` : 'Calculating'}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Card glow>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  <Bot className="h-3.5 w-3.5" />
                  AI Diagnosis
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">{rootCause}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{explanation}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-right ${severityTone(severity)}`}>
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Severity</p>
                <p className="text-xl font-bold">{severity}</p>
                <p className="mt-1 text-[11px] opacity-75">Fix time: {estimatedFixTime}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</p>
                <p className="mt-2 text-sm font-semibold text-white">{toText(diagnosis.category, 'Build')}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Auto Fixable</p>
                <p className="mt-2 text-sm font-semibold text-white">{autoFixable ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estimate</p>
                <p className="mt-2 text-sm font-semibold text-white">{estimatedFixTime}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  <Wrench className="h-3.5 w-3.5" />
                  Recommended Fixes
                </div>
                <h2 className="mt-3 text-xl font-semibold text-white">Safe next steps</h2>
              </div>
              <Button variant="primary" onClick={() => applyFixMutation.mutate()} disabled={!autoFixable || applyFixMutation.isPending} isLoading={applyFixMutation.isPending}>
                Apply Fix
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {suggestedFixes.length > 0 ? suggestedFixes.map((fix, index) => (
                <div key={`${toText(fix.description, 'fix')}-${index}`} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{toText(fix.description, toText(fix.title, `Suggested fix ${index + 1}`))}</p>
                      {fix.command && <p className="mt-2 rounded-xl border border-white/8 bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-200">{String(fix.command)}</p>}
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" />
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-6 text-sm text-slate-400">
                  No suggested fixes have been generated yet. Run analysis to populate this section.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-300" />
              <h2 className="text-xl font-semibold text-white">AI Timeline</h2>
            </div>
            <div className="mt-5 space-y-4">
              {timeline.length > 0 ? timeline.map((step: Record<string, any>, index: number) => (
                <div key={`${toText(step.name, 'Step')}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${String(step.status).toLowerCase() === 'failed' ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>
                      {index + 1}
                    </div>
                    {index < timeline.length - 1 && <div className="mt-2 h-full w-px bg-white/10" />}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/8 bg-white/4 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">{toText(step.name, 'Step')}</p>
                      <StatusBadge status={toText(step.status, 'Pending')} />
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{toText(step.detail, 'Waiting for diagnostics')}</p>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-6 text-sm text-slate-400">
                  Timeline data will appear here after a deployment runs.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-violet-300" />
              <h2 className="text-xl font-semibold text-white">History</h2>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/8">
              <div className="grid grid-cols-12 gap-3 border-b border-white/8 bg-white/4 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Error</div>
                <div className="col-span-2">Severity</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-4">Root Cause</div>
              </div>
              <div className="divide-y divide-white/8 bg-slate-950/50">
                {latestHistory.length > 0 ? latestHistory.map((item, index) => (
                  <div key={`${toText(item.id, 'history')}-${index}`} className="grid grid-cols-12 gap-3 px-4 py-4 text-sm text-slate-300">
                    <div className="col-span-2 text-xs text-slate-500">{toText(item.createdAt, 'recent')}</div>
                    <div className="col-span-2 font-medium text-white">{toText(item.errorType, 'Unknown')}</div>
                    <div className="col-span-2">{toText(item.severity, 'Medium')}</div>
                    <div className="col-span-2">{toText(item.confidenceScore, '90')}%</div>
                    <div className="col-span-4 truncate" title={toText(item.rootCause, '')}>{toText(item.rootCause, 'Pending diagnosis')}</div>
                  </div>
                )) : (
                  <div className="px-4 py-10 text-sm text-slate-400">No diagnosis history yet for this project.</div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-cyan-300" />
              <h2 className="text-xl font-semibold text-white">Project Snapshot</h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 text-slate-300">
                <dt className="text-slate-500">Status</dt>
                <dd><StatusBadge status={deployment?.status || 'Offline'} /></dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 text-slate-300">
                <dt className="text-slate-500">Error Type</dt>
                <dd className="text-right font-medium text-white">{errorType}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 text-slate-300">
                <dt className="text-slate-500">Severity</dt>
                <dd className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityTone(severity)}`}>{severity}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <dt className="text-slate-500">Estimated Fix</dt>
                <dd className="font-medium text-white">{estimatedFixTime}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-300" />
              <h2 className="text-xl font-semibold text-white">Security Scan</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-white">{toText(security.securityScore, '—')}</p>
            <p className="mt-1 text-sm text-slate-400">Security score and findings for the selected project.</p>
            <div className="mt-5 space-y-3">
              {securityFindings.length > 0 ? securityFindings.slice(0, 3).map((finding, index) => (
                <div key={`${toText(finding.title, 'finding')}-${index}`} className="rounded-2xl border border-white/8 bg-white/4 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{toText(finding.title, 'Finding')}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{toText(finding.description, 'No description available')}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">{toText(finding.severity, 'Info')}</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm text-slate-400">No security issues detected yet.</div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-300" />
              <h2 className="text-xl font-semibold text-white">Performance Advisor</h2>
            </div>
            <p className="mt-4 text-3xl font-bold text-white">{toText(performance.healthScore ?? report.healthScore, '—')}</p>
            <p className="mt-1 text-sm text-slate-400">Deployment health and optimization suggestions.</p>
            <div className="mt-5 space-y-3">
              {performanceRecommendations.length > 0 ? performanceRecommendations.slice(0, 3).map((recommendation, index) => (
                <div key={`${toText(recommendation.title, 'recommendation')}-${index}`} className="rounded-2xl border border-white/8 bg-white/4 p-3">
                  <div className="flex items-start gap-3">
                    <ListChecks className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">{toText(recommendation.title, 'Recommendation')}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{toText(recommendation.actionableStep, recommendation.description)}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm text-slate-400">No performance recommendations yet.</div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-300" />
              <h2 className="text-xl font-semibold text-white">AI Report</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-500">Health Score:</span> {toText(report.healthScore, '—')}</p>
              <p><span className="text-slate-500">Security Grade:</span> {toText(report.securityGrade, '—')}</p>
              <p><span className="text-slate-500">Generated:</span> {toText(report.generatedAt, 'Pending')}</p>
              {topRecommendation && (
                <p><span className="text-slate-500">Top Recommendation:</span> {toText(topRecommendation.title, 'Review report')}</p>
              )}
            </div>
            <Button
              variant="secondary"
              className="mt-5 w-full"
              onClick={() => window.open(`${apiBase}/ai/report?projectId=${encodeURIComponent(activeProjectId)}${activeDeploymentId ? `&deploymentId=${encodeURIComponent(activeDeploymentId)}` : ''}`, '_blank', 'noopener,noreferrer')}
            >
              Open Report Endpoint
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-amber-300" />
              <h2 className="text-xl font-semibold text-white">Next Step</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {autoFixable
                ? 'The issue is safe to automate. Apply the fix, redeploy, and verify the timeline turns healthy.'
                : 'Review the root cause, make the minimal safe change, and run another analysis after redeployment.'}
            </p>
            <div className="mt-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1"><Clock3 className="h-3.5 w-3.5" />{estimatedFixTime}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1"><History className="h-3.5 w-3.5" />{latestHistory.length} recent diagnoses</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
          <Sparkles className="h-4 w-4 text-indigo-300" />
          AI confidence: {confidence || 'pending'}%
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
          <Activity className="h-4 w-4 text-cyan-300" />
          Health score: {healthScore || 'pending'}/100
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
          <ShieldAlert className="h-4 w-4 text-rose-300" />
          Security findings: {securityFindings.length}
        </span>
      </div>
    </div>
  );
};
