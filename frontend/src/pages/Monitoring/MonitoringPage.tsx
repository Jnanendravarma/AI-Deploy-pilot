import React from 'react';
import { useLocation } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const MonitoringPage: React.FC = () => {
  const location = useLocation();
  const { projects, monitoring } = useProjects();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';
  const projectName = projects.find((project) => project.id === projectId)?.name || 'project';

  const cpuUsagePercent = Number(monitoring?.cpuUsagePercent || 0);
  const memoryUsedMb = Number(monitoring?.memoryUsedMb || 0);
  const memoryTotalMb = Number(monitoring?.memoryTotalMb || 0);
  const loadAverage = Array.isArray(monitoring?.loadAverage) ? monitoring?.loadAverage as number[] : [0, 0, 0];
  const platform = String(monitoring?.platform || 'unknown');

  return (
    <div className="flex flex-col gap-8 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-heading">Infrastructure Monitoring for <span className="text-gradient-purple">{projectName}</span></h1>
          <p className="text-xs text-slate-500 mt-1">Live host metrics from backend monitoring endpoint.</p>
        </div>
        <StatusBadge status="Healthy" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center gap-4 border border-white/6 p-6">
          <span className="text-xs text-slate-500">CPU Usage</span>
          <span className="text-3xl font-heading text-white">{cpuUsagePercent}%</span>
        </Card>
        <Card className="flex flex-col items-center gap-4 border border-white/6 p-6">
          <span className="text-xs text-slate-500">Memory</span>
          <span className="text-3xl font-heading text-white">{memoryUsedMb} MB</span>
        </Card>
        <Card className="flex flex-col items-center gap-4 border border-white/6 p-6">
          <span className="text-xs text-slate-500">Platform</span>
          <span className="text-3xl font-heading text-white">{platform}</span>
        </Card>
      </div>

      <Card className="p-5 border border-white/6 flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-400 font-heading">System Snapshot</h3>
        <div className="flex flex-col gap-3.5 border-t border-white/4 pt-4 text-xs text-slate-400 leading-normal">
          <div className="flex items-center justify-between">
            <span>CPU Allocation</span>
            <span className="font-mono text-white font-bold">{cpuUsagePercent}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Memory Overhead</span>
            <span className="font-mono text-white font-bold">{memoryUsedMb} MB / {memoryTotalMb} MB</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Load Average</span>
            <span className="font-mono text-white font-bold">{loadAverage.join(' / ')}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
