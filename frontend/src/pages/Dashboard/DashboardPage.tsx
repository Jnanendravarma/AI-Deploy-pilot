import React from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { projects, incidents, analytics, loadingProjects, loadingAnalytics } = useProjects();

  const stats = [
    {
      name: 'Total Deployments',
      value: loadingAnalytics ? '...' : String(analytics?.totalDeployments ?? 0),
      desc: 'Completed deployment runs',
      trend: `${analytics?.successRate ?? 0}% success`
    },
    {
      name: 'Connected Projects',
      value: loadingProjects ? '...' : projects.length.toString(),
      desc: 'Active edge services online',
      trend: `${projects.length} total`
    },
    {
      name: 'Average Build Speed',
      value: loadingAnalytics ? '...' : `${(((analytics?.averageBuildTimeMs ?? 0) / 1000) || 0).toFixed(1)}s`,
      desc: 'Average end-to-end build time',
      trend: `${analytics?.failureRate ?? 0}% failure`
    },
    {
      name: 'Autopilot Incidents',
      value: incidents.length.toString(),
      desc: 'Current warning/failure incidents',
      trend: 'Live feed'
    }
  ];

  return (
    <div className="flex flex-col gap-8 select-none">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="flex flex-col gap-2 p-5 border border-white/6 hover:border-primary/20 transition-all duration-300">
            <span className="text-xs text-slate-500 font-semibold">{stat.name}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-heading">{stat.value}</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                {stat.trend}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 leading-tight">{stat.desc}</span>
          </Card>
        ))}
      </div>

      {/* Projects Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-heading">Connected Projects</h2>
          <span className="text-xs text-slate-400 font-semibold">{projects.length} online</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:border-primary/30 transition-all duration-300 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex flex-col">
                    <Link
                      to={`/deployment?projectId=${project.id}`}
                      className="text-base font-bold text-white hover:text-primary transition font-heading"
                    >
                      {project.name}
                    </Link>
                    <span className="text-[10px] text-slate-500 font-semibold mt-0.5">{project.framework} Preset</span>
                  </div>
                  <StatusBadge status="Active" />
                </div>

                <div className="flex flex-col gap-2 border-t border-white/4 pt-3.5 mb-6 text-xs text-slate-400 leading-normal">
                  <div className="flex items-center justify-between">
                    <span>Active deployment</span>
                    <span className="font-mono text-slate-200">{project.activeDeploymentId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Commit hash</span>
                    <span className="font-mono text-slate-200 truncate max-w-[160px]">{project.commit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Target branch</span>
                    <span className="font-mono text-slate-200">{project.branch}</span>
                  </div>
                </div>
              </div>

              {/* Shortcut actions links bar */}
              <div className="flex items-center justify-between border-t border-white/4 pt-3 text-[11px] font-bold text-slate-400">
                <Link to={`/logs?projectId=${project.id}&deploymentId=${project.activeDeploymentId || ''}`} className="hover:text-primary transition flex items-center gap-1">
                  <span>Logs</span>
                </Link>
                <Link to={`/monitoring?projectId=${project.id}`} className="hover:text-primary transition flex items-center gap-1">
                  <span>Monitoring</span>
                </Link>
                <Link to={`/settings?projectId=${project.id}`} className="hover:text-primary transition flex items-center gap-1">
                  <span>Settings</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Autopilot Incident Activity feed */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white font-heading">Autopilot Healing Feed</h2>
        <Card className="p-0 border border-white/6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/6 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Target Project</th>
                  <th className="p-4">Incident Issue</th>
                  <th className="p-4">Resolution Description</th>
                  <th className="p-4">Autopilot Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4 text-slate-300">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/1 transition-all">
                    <td className="p-4 text-slate-500 font-semibold">{inc.time}</td>
                    <td className="p-4 font-bold text-white">{inc.project}</td>
                    <td className="p-4 font-mono font-bold text-red-400">{inc.issue}</td>
                    <td className="p-4 text-slate-400 leading-normal">{inc.description}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={5}>No active incidents.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
};
