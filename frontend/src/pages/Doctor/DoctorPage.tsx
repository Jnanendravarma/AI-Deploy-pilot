import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useProjects } from '../../context/ProjectContext';
import { deploymentApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const DoctorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerToast, projects, retryDeployment } = useProjects();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';
  const deploymentId = queryParams.get('deploymentId') || '';

  const projectName = projects.find((project) => project._id === projectId)?.name || 'project';
  const [isPatching, setIsPatching] = useState(false);

  // Fetch error diagnostics dynamically
  const { data: errorPayload, isLoading } = useQuery<Record<string, any> | null>({
    queryKey: ['deploymentError', deploymentId],
    queryFn: async () => {
      if (!deploymentId) return null;
      const res = await deploymentApi.error(deploymentId);
      return res.data;
    },
    enabled: !!deploymentId
  });

  const handleApplyPatch = async () => {
    if (!deploymentId) return;
    setIsPatching(true);
    triggerToast('Applying configuration hotfix and queueing pipeline retry...', 'success');

    try {
      const newDeployment = await retryDeployment(deploymentId);
      triggerToast('Hotfix patch deployed successfully!', 'success');
      navigate(`/deployment?projectId=${projectId}&deploymentId=${newDeployment._id}`);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Unable to apply hotfix', 'error');
    } finally {
      setIsPatching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 select-none animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-white/10 rounded" />
          <div className="h-9 w-32 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-white/5 rounded-xl" />
          <div className="lg:col-span-5 h-96 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!errorPayload) {
    return (
      <div className="flex flex-col gap-6 select-none">
        <Card className="p-8 border border-white/6 text-center">
          <h2 className="text-sm font-bold text-white mb-2">No Incident Logged</h2>
          <p className="text-xs text-slate-500 mb-6">This deployment completed successfully or has no diagnosed failures.</p>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/deployment?projectId=${projectId}`)}>
            Back to Pipeline
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-heading flex items-center gap-2">
            AI Deployment Doctor for <span className="text-gradient-purple">{projectName}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Autonomous diagnostics and config repair desk.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/deployment?projectId=${projectId}`)}>
          Back to Pipeline
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Code Diff and File Info */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-400">Proposed Correction Patch</h2>
          
          <Card className="p-0 border border-white/6 overflow-hidden">
            <div className="bg-slate-950/40 p-4 border-b border-white/6 flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span className="font-bold">config/deployment_doctor_patch.diff</span>
              <span className="bg-primary/20 text-indigo-400 border border-primary/20 px-2 py-0.5 rounded">RECOMMENDED</span>
            </div>

            {/* Diff Content box */}
            <div className="p-6 font-mono text-[11px] leading-relaxed bg-slate-950/20 text-emerald-300">
              <pre className="whitespace-pre-wrap break-all">
                {`+++ Suggested Solution for: ${errorPayload.rootCause}\n\n`}
                {errorPayload.suggestedFix}
              </pre>
            </div>

            {/* Actions drawer */}
            <div className="p-4 bg-slate-950/40 border-t border-white/6 flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleApplyPatch}
                isLoading={isPatching}
                size="sm"
              >
                Apply Hotfix & Retry
              </Button>
              {errorPayload.documentationLink && (
                <a
                  href={errorPayload.documentationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center font-semibold rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/8 px-4 py-2 text-xs transition-all duration-200"
                >
                  View Guide Documentation
                </a>
              )}
            </div>
          </Card>
        </div>

        {/* Right: AI diagnosis bubble and details */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-400">AI Diagnostics Scan</h2>

          <Card className="p-6 border border-white/6 flex flex-col gap-4">
            <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <span>🤖 Diagnostics Scan Report</span>
            </h3>

            <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl p-4 leading-normal">
              <strong>Incident Root Cause:</strong>
              <p className="mt-1 font-mono text-[11px]">{errorPayload.rootCause}</p>
            </div>

            <div className="flex flex-col gap-3.5 border-t border-white/4 pt-4 text-xs text-slate-400 leading-normal">
              <span className="font-bold text-slate-300">Likely Causes Analyzed:</span>
              {(errorPayload.possibleCauses || []).map((cause: string, i: number) => (
                <div key={i} className="flex flex-col gap-1 border-l-2 border-slate-700 pl-3">
                  <span className="font-bold text-slate-300">{cause}</span>
                </div>
              ))}
              {(!errorPayload.possibleCauses || errorPayload.possibleCauses.length === 0) && (
                <span className="italic text-slate-500">No additional possible causes cataloged.</span>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/4 pt-4 text-xs">
              <span className="text-slate-400">Scan Confidence</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/15">
                {errorPayload.confidenceScore}% Accuracy
              </span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
