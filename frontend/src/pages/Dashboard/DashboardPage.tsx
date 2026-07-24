import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { autoDetectFramework } from '../../utils/frameworkDetector';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, incidents, analytics, loadingProjects, loadingAnalytics } = useProjects();

  const stats = [
    {
      name: 'Total Deployments',
      value: loadingAnalytics ? '...' : String(analytics?.totalDeployments ?? 0),
      desc: 'Completed deployment runs',
      trend: `${analytics?.successRate ?? 100}% success`
    },
    {
      name: 'Connected Projects',
      value: loadingProjects ? '...' : projects.length.toString(),
      desc: 'Active edge services online',
      trend: `${projects.length} active`
    },
    {
      name: 'Average Build Speed',
      value: loadingAnalytics ? '...' : `${(((analytics?.averageBuildTimeMs ?? 45000) / 1000) || 0).toFixed(1)}s`,
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
      
      {/* Metrics Header Grid */}
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

      {/* Module 2: Project Cards Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white font-heading">Connected Projects</h2>
            <span className="text-xs text-slate-400 font-semibold bg-white/5 border border-white/8 px-2.5 py-0.5 rounded-full">
              {projects.length} online
            </span>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center justify-center font-semibold rounded-xl bg-primary text-white hover:bg-indigo-600 px-4 py-2 text-xs transition-all duration-200 shadow-md"
          >
            + New Project
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const fwInfo = autoDetectFramework(project.framework || project.name);
            const visibility = project.metadata?.visibility || 'public';
            const createdDate = new Date(project.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <Card
                key={project.id}
                className="group hover:border-primary/40 transition-all duration-300 flex flex-col justify-between p-6 border border-white/6 hover:shadow-[0_10px_30px_rgba(2,6,23,0.8)]"
              >
                <div>
                  {/* Card Header: Logo, Name, Visibility, Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${fwInfo.iconBg} border border-white/10 flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-sm`}>
                        {fwInfo.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          to={`/deployment?projectId=${project.id}`}
                          className="text-base font-bold text-white hover:text-primary transition font-heading truncate"
                        >
                          {project.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-semibold px-2 py-0.2 rounded border ${fwInfo.badgeColor}`}>
                            {fwInfo.name}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono uppercase">
                            {visibility}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status="Healthy" />
                  </div>

                  {/* Metadata List */}
                  <div className="flex flex-col gap-2 border-t border-white/4 pt-3.5 mb-5 text-xs text-slate-400 leading-normal">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Active Deployment</span>
                      <span className="font-mono text-slate-200 truncate max-w-[140px]">
                        {project.activeDeploymentId ? `dep-${project.activeDeploymentId.slice(-6)}` : 'dep-live'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Commit Hash</span>
                      <span className="font-mono text-slate-200 truncate max-w-[140px]">{project.commit || 'main@head'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Created Date</span>
                      <span className="text-slate-300 font-semibold">{createdDate}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Bar */}
                <div className="flex items-center justify-between border-t border-white/4 pt-3 text-[11px] font-bold text-slate-400">
                  <Link
                    to={`/logs?projectId=${project.id}&deploymentId=${project.activeDeploymentId || ''}`}
                    className="hover:text-primary transition flex items-center gap-1 py-1"
                  >
                    <span>Logs</span>
                  </Link>
                  <Link
                    to={`/monitoring?projectId=${project.id}`}
                    className="hover:text-primary transition flex items-center gap-1 py-1"
                  >
                    <span>Metrics</span>
                  </Link>
                  <Link
                    to={`/settings?projectId=${project.id}&tab=env`}
                    className="hover:text-primary transition flex items-center gap-1 py-1"
                  >
                    <span>Env Vars</span>
                  </Link>
                  <Link
                    to={`/settings?projectId=${project.id}`}
                    className="hover:text-primary transition flex items-center gap-1 py-1 text-slate-300 hover:text-white"
                  >
                    <span>Settings</span>
                  </Link>
                </div>
              </Card>
            );
          })}

          {projects.length === 0 && (
            <Card className="col-span-full p-12 border border-white/6 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-bold text-white">No projects created yet</span>
                <span className="text-xs text-slate-400">Deploy your first project using GitHub URL or ZIP upload.</span>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate('/upload')} className="mt-2">
                + Create First Project
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Autopilot Healing Incident Feed */}
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
                    <td className="p-4 text-slate-500" colSpan={5}>No active incidents detected. All edge services healthy.</td>
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
