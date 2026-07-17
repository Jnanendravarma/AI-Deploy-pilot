import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { deploymentApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface EnvVar {
  id: string;
  key: string;
  value: string;
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { addProject, triggerToast } = useProjects();

  const [search, setSearch] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  const [framework, setFramework] = useState('nextjs');
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reposList = [] as Array<{ name: string; preset: string; updated: string }>;

  const handleSelectRepo = (repoName: string, preset: string) => {
    setSelectedRepo(repoName);
    setProjectName(repoName);
    setFramework(preset);
    setProjectNameError('');
    triggerToast(`Selected repo: ${repoName}`, 'success');
  };

  const handleAddEnv = () => {
    setEnvVars((prev) => [...prev, { id: Math.random().toString(), key: '', value: '' }]);
  };

  const handleRemoveEnv = (id: string) => {
    setEnvVars((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEnvChange = (id: string, field: 'key' | 'value', value: string) => {
    setEnvVars((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setProjectNameError('Please specify a project name');
      return;
    }

    triggerToast('Creating project and deployment...', 'success');

    const selectedFwName = 
      framework === 'nextjs' ? 'Next.js' :
      framework === 'vite' ? 'React / Vite' :
      framework === 'astro' ? 'Astro' :
      framework === 'docker' ? 'Docker' : 'Python Stack';

    try {
      setSubmitting(true);
      const projectId = await addProject(projectName, selectedFwName, envVars);
      if (!projectId) {
        throw new Error('Project could not be created');
      }

      const deployment = await deploymentApi.create({ projectId });
      navigate(`/deployment?projectId=${projectId}&deploymentId=${String(deployment.data._id)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create deployment';
      triggerToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRepos = reposList.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-heading">Deploy a New Project</h1>
          <p className="text-xs text-slate-500 mt-1">Connect a repository from your GitHub account to establish edge nodes.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          Cancel & Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Repo Import Selection */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-400">1. Select Repository</h2>
          <Card className="p-5 border border-white/6 flex flex-col gap-4">
            <Input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
              icon={(
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
            />

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {filteredRepos.map((repo) => {
                const isSelected = selectedRepo === repo.name;
                return (
                  <div
                    key={repo.name}
                    onClick={() => handleSelectRepo(repo.name, repo.preset)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.08)]'
                        : 'bg-white/1 border-white/5 hover:border-white/10 hover:bg-white/2 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold font-heading">{repo.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{repo.updated}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                      isSelected ? 'bg-primary text-white' : 'bg-white/5 border border-white/8 text-slate-400'
                    }`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </div>
                );
              })}
                {filteredRepos.length === 0 && (
                  <span className="text-xs text-slate-500 italic">Connect GitHub integration to list repositories. You can still create a manual project from the form.</span>
                )}
            </div>
          </Card>
        </div>

        {/* Right Side: Build Configuration Form */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-400">2. Configure Settings</h2>
          <Card className="p-8 border border-white/6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Project Name */}
              <Input
                id="project-name"
                label="Project Name"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setProjectNameError('');
                }}
                error={projectNameError}
                placeholder="my-awesome-project"
              />

              {/* Framework selector dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400">Framework Preset</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="h-[54px] w-full rounded-xl bg-slate-950/80 border border-white/8 text-sm text-white px-4 focus:outline-none focus:border-primary cursor-pointer select-none"
                >
                  <option value="nextjs">Next.js (App Router)</option>
                  <option value="vite">Vite (React / Vue / Svelte)</option>
                  <option value="astro">Astro</option>
                  <option value="docker">Docker / Multi-Stage</option>
                  <option value="python">Python Stack Preset</option>
                </select>
              </div>

              {/* Env Variables Section */}
              <div className="flex flex-col gap-4 border-t border-white/4 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Environment Variables</span>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddEnv}>
                    + Add Row
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  {envVars.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-white/4 bg-white/1">
                      <div className="flex-1">
                        <Input
                          placeholder="KEY"
                          value={item.key}
                          onChange={(e) => handleEnvChange(item.id, 'key', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="VALUE"
                          value={item.value}
                          onChange={(e) => handleEnvChange(item.id, 'value', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEnv(item.id)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 py-2 sm:px-2 cursor-pointer select-none self-end sm:self-center"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {envVars.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No environment variables defined yet.</span>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" variant="primary" className="h-12 w-full mt-4 font-semibold text-sm" isLoading={submitting}>
                Commence Deployment
              </Button>

            </form>
          </Card>
        </div>

      </div>
    </div>
  );
};
