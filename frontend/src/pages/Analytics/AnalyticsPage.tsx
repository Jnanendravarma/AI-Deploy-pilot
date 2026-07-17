import React from 'react';
import { Card } from '../../components/ui/Card';
import { useProjects } from '../../context/ProjectContext';

export const AnalyticsPage: React.FC = () => {
  const { analytics, loadingAnalytics } = useProjects();

  const stats = [
    { name: 'Total Deployments Run', value: analytics?.totalDeployments ?? 0, desc: 'All deployment executions' },
    { name: 'Success Rate', value: `${analytics?.successRate ?? 0}%`, desc: 'Healthy/running deployment ratio' },
    { name: 'Failure Rate', value: `${analytics?.failureRate ?? 0}%`, desc: 'Failed deployment ratio' },
    { name: 'Avg Build Duration', value: `${(((analytics?.averageBuildTimeMs ?? 0) / 1000) || 0).toFixed(1)}s`, desc: 'Average pipeline duration' }
  ];

  return (
    <div className="flex flex-col gap-8 select-none">
      <div>
        <h1 className="text-xl font-bold text-white font-heading">Performance Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Database-backed deployment and framework analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="flex flex-col gap-2 p-5 border border-white/6 hover:border-primary/20 transition-all duration-300">
            <span className="text-xs text-slate-500 font-semibold">{stat.name}</span>
            <span className="text-2xl font-bold text-white font-heading">{loadingAnalytics ? '...' : stat.value}</span>
            <span className="text-[10px] text-slate-400 mt-1">{stat.desc}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-white/6">
          <h3 className="text-sm font-bold text-white font-heading mb-4">Framework Distribution</h3>
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            {(analytics?.frameworkDistribution || []).map((row: any) => (
              <div key={row.framework} className="flex items-center justify-between border-b border-white/5 pb-2">
                <span>{row.framework}</span>
                <span className="font-mono text-slate-200">{row.count}</span>
              </div>
            ))}
            {!loadingAnalytics && (!analytics?.frameworkDistribution || analytics.frameworkDistribution.length === 0) && (
              <p className="text-slate-500">No framework data yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6 border border-white/6">
          <h3 className="text-sm font-bold text-white font-heading mb-4">Top Deployment Errors</h3>
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            {(analytics?.topErrors || []).map((row: any) => (
              <div key={row.name} className="flex items-center justify-between border-b border-white/5 pb-2">
                <span>{row.name}</span>
                <span className="font-mono text-red-300">{row.count}</span>
              </div>
            ))}
            {!loadingAnalytics && (!analytics?.topErrors || analytics.topErrors.length === 0) && (
              <p className="text-slate-500">No deployment errors recorded.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
