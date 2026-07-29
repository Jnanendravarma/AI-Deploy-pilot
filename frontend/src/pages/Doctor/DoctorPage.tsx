import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useProjects } from '../../context/ProjectContext';
import { aiApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { ExternalLink } from 'lucide-react';


export const DoctorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useProjects();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';
  const deploymentId = queryParams.get('deploymentId') || '';

  const projectName = projects.find((project) => project._id === projectId)?.name || 'project';

  const { data: diagnosisPayload, isLoading } = useQuery<Record<string, any> | null>({
    queryKey: ['aiDiagnosis', deploymentId],
    queryFn: async () => {
      if (!deploymentId) return null;
      const res = await aiApi.getDiagnosis(deploymentId);
      return res.data;
    },
    enabled: !!deploymentId
  });

  if (isLoading) {
    return <Loader>Loading AI Diagnosis...</Loader>
  }

  if (!diagnosisPayload) {
    return (
      <Card>
        <Alert>
          <AlertTitle>No Diagnosis Found</AlertTitle>
          <AlertDescription>
            No AI diagnosis is available for this deployment.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  const {
    errorType,
    severity,
    rootCause,
    humanExplanation,
    suggestedFixes,
    estimatedFixTime,
    autoFixable,
  } = diagnosisPayload;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Deployment Doctor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analysis for deployment <span className="font-mono">{deploymentId.slice(0, 8)}</span> on project <span className="font-bold">{projectName}</span>
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}/deployments`)}>
          Back to Deployments
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Root Cause</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{projectName}</TableCell>
              <TableCell><Badge variant="destructive">Failed</Badge></TableCell>
              <TableCell>{errorType}</TableCell>
              <TableCell>{severity}</TableCell>
              <TableCell className="font-mono">{rootCause}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <h2 className="text-lg font-semibold mb-2">AI Diagnosis</h2>
            <p className="text-sm text-slate-300">{humanExplanation}</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold mb-2">Recommended Fixes</h2>
            <div className="flex flex-col gap-4">
              {suggestedFixes.map((fix: any, index: number) => (
                <div key={index} className="p-4 bg-slate-800 rounded-lg">
                  <h3 className="font-bold">{fix.description}</h3>
                  {fix.command && <pre className="text-xs bg-slate-900 p-2 rounded-md mt-2 font-mono">{fix.command}</pre>}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="text-lg font-semibold mb-2">Details</h2>
            <div className="text-sm space-y-2">
              <p><strong>Estimated Fix Time:</strong> {estimatedFixTime}</p>
              <p><strong>Auto-Fixable:</strong> {autoFixable ? 'Yes' : 'No'}</p>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold mb-2">Actions</h2>
            <div className="flex flex-col gap-2">
              {autoFixable && <Button>Apply Fix</Button>}
              <Button variant="outline" asChild>
                <Link to={`/ai-chat?deploymentId=${deploymentId}`}>Ask AI <ExternalLink className="ml-2" /></Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/projects/${projectId}/history`}>View History <ExternalLink className="ml-2" /></Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
