import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface EnvVarItem {
  key: string;
  value: string;
  masked?: boolean;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { deleteProject, triggerToast, projects, updateProjectSettings, user, logout } = useProjects();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';
  const tabParam = queryParams.get('tab') || '';
  const currentProject = projects.find((project) => project._id === projectId || project.id === projectId);
  const projectName = currentProject?.name || 'Project';

  const [activeTab, setActiveTab] = useState<'general' | 'env' | 'domains' | 'danger' | 'account'>(
    tabParam === 'env' ? 'env' : (tabParam === 'account' || !projectId) ? 'account' : 'general'
  );
  
  // General settings state
  const [nameInput, setNameInput] = useState(currentProject?.name || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    (currentProject?.metadata?.visibility as 'public' | 'private') || 'public'
  );
  const [repoUrl, setRepoUrl] = useState(currentProject?.repositoryUrl || '');
  const [buildCommand, setBuildCommand] = useState(currentProject?.metadata?.buildCommand || 'npm run build');
  const [outputDirectory, setOutputDirectory] = useState(currentProject?.metadata?.outputDirectory || 'dist');
  const [isArchived, setIsArchived] = useState(currentProject?.archived || false);
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Env Vars state
  const [envVars, setEnvVars] = useState<EnvVarItem[]>(currentProject?.envVars || []);
  const [savingEnv, setSavingEnv] = useState(false);

  // Domains state
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setNameInput(currentProject.name);
      setVisibility((currentProject.metadata?.visibility as 'public' | 'private') || 'public');
      setRepoUrl(currentProject.repositoryUrl || '');
      setBuildCommand(currentProject.metadata?.buildCommand || 'npm run build');
      setOutputDirectory(currentProject.metadata?.outputDirectory || 'dist');
      setIsArchived(currentProject.archived || false);
      setEnvVars(currentProject.envVars || []);
    }
  }, [currentProject]);

  const activeDomains = currentProject?.metadata?.domains || [];

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setSavingGeneral(true);
    try {
      await updateProjectSettings(projectId, {
        name: nameInput.toLowerCase().trim(),
        repositoryUrl: repoUrl.trim(),
        metadata: {
          visibility,
          buildCommand,
          outputDirectory
        }
      });
      triggerToast('Project settings synchronized to database', 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveEnvVars = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setSavingEnv(true);
    try {
      await updateProjectSettings(projectId, {
        envVars: envVars.map(ev => ({ key: ev.key.trim(), value: ev.value }))
      });
      triggerToast('Environment variables updated securely', 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to update environment variables', 'error');
    } finally {
      setSavingEnv(false);
    }
  };

  const handleAddEnvRow = () => {
    setEnvVars(prev => [...prev, { key: '', value: '', masked: true }]);
  };

  const handleRemoveEnvRow = (index: number) => {
    setEnvVars(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    setEnvVars(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleToggleArchive = async () => {
    if (!projectId) return;
    try {
      await updateProjectSettings(projectId, {
        archived: !isArchived
      });
      setIsArchived(!isArchived);
      triggerToast(`Project ${!isArchived ? 'archived' : 'unarchived'}`, 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to toggle archive status', 'error');
    }
  };

  const handleDisconnectGithub = async () => {
    if (!projectId) return;
    const confirm = window.confirm('Disconnect GitHub repository from this project?');
    if (!confirm) return;

    try {
      await updateProjectSettings(projectId, {
        repositoryUrl: ''
      });
      setRepoUrl('');
      triggerToast('GitHub integration disconnected', 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to disconnect repository', 'error');
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !projectId) return;

    const domainName = newDomain.toLowerCase().trim();
    if (activeDomains.includes(domainName)) {
      triggerToast('Domain is already linked', 'error');
      return;
    }

    setAddingDomain(true);
    try {
      const updatedDomains = [...activeDomains, domainName];
      await updateProjectSettings(projectId, {
        metadata: {
          domains: updatedDomains
        }
      });
      setNewDomain('');
      triggerToast(`Domain linked: ${domainName}`, 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to link domain', 'error');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domainName: string) => {
    if (!projectId) return;
    const confirm = window.confirm(`Remove domain ${domainName}?`);
    if (!confirm) return;

    try {
      const updatedDomains = activeDomains.filter((d: string) => d !== domainName);
      await updateProjectSettings(projectId, {
        metadata: {
          domains: updatedDomains
        }
      });
      triggerToast(`Domain removed: ${domainName}`, 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to remove domain', 'error');
    }
  };

  const handleDelete = () => {
    const confirm = window.confirm(`Are you sure you want to delete "${projectName}"? All deployments and logs will be permanently deleted.`);
    if (confirm) {
      if (!projectId) {
        triggerToast('Project ID missing', 'error');
        return;
      }
      void deleteProject(projectId).then(() => navigate('/dashboard'));
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-6xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white font-heading">
          {activeTab === 'account' ? (
            <span>Account Settings</span>
          ) : (
            <span>Settings for <span className="text-gradient-purple">{projectName}</span></span>
          )}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {activeTab === 'account' ? (
            <span>Manage your user profile credentials and security.</span>
          ) : (
            <span>Configure project details, environment variables, visibility, and danger settings.</span>
          )}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar Tabs */}
        <div className="lg:col-span-3 flex flex-row overflow-x-auto lg:flex-col gap-1.5 pb-2.5 lg:pb-0 scrollbar-none select-none">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-center lg:text-left px-4 py-3 rounded-xl transition border cursor-pointer ${
              activeTab === 'account'
                ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_10px_rgba(99,102,241,0.05)]'
                : 'bg-transparent border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            Account Profile
          </button>

          {projectId && (['general', 'env', 'domains', 'danger'] as const).map((tab) => {
            const labels = {
              general: 'General Settings',
              env: 'Environment Variables',
              domains: 'Custom Domains',
              danger: 'Danger Zone'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-center lg:text-left px-4 py-3 rounded-xl transition border cursor-pointer ${
                  activeTab === tab
                    ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_10px_rgba(99,102,241,0.05)]'
                    : 'bg-transparent border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Right Content */}
        <div className="lg:col-span-9">
          
          {/* Account Settings */}
          {activeTab === 'account' && (
            <Card className="p-8 border border-white/6 flex flex-col gap-6">
              <div>
                <h2 className="text-sm font-bold text-slate-300 font-heading">User Profile</h2>
                <p className="text-[10px] text-slate-500 mt-1">Manage your active user account credentials.</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 border-b border-white/5 pb-5">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xl text-white">
                      {(user?.name || 'DU').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{user?.name || 'Developer'}</span>
                    <span className="text-xs text-slate-400 mt-0.5">{user?.email || 'No email associated'}</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-primary/10 text-primary border-primary/20 mt-1.5 w-max uppercase">
                      {user?.role || 'developer'} Account
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" value={user?.name || ''} disabled className="opacity-60" />
                  <Input label="Email Address" value={user?.email || ''} disabled className="opacity-60" />
                </div>

                <div className="border-t border-white/5 pt-5 mt-2 flex justify-start">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="px-5 py-2 h-10 text-xs font-semibold flex items-center gap-2"
                  >
                    Logout Account
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Module 6: General Project Settings (Rename, Visibility, GitHub Connection) */}
          {activeTab === 'general' && (
            <Card className="p-8 border border-white/6 flex flex-col gap-6">
              <h2 className="text-sm font-bold text-slate-300 font-heading">General Settings & Visibility</h2>
              <form onSubmit={handleSaveGeneral} className="flex flex-col gap-5">
                
                {/* Rename Project */}
                <Input
                  label="Rename Project"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="my-project-name"
                />

                {/* Project Visibility */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Project Access & Visibility</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        visibility === 'public'
                          ? 'bg-primary/10 border-primary text-white'
                          : 'bg-slate-950 border-white/8 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold text-white">Public</span>
                      <span className="text-[10px] text-slate-400">Accessible deployment links</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibility('private')}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        visibility === 'private'
                          ? 'bg-primary/10 border-primary text-white'
                          : 'bg-slate-950 border-white/8 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold text-white">Private</span>
                      <span className="text-[10px] text-slate-400">Restricted edge authorization</span>
                    </button>
                  </div>
                </div>

                {/* GitHub Repository Connection */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">GitHub Repository Connection</label>
                    {repoUrl && (
                      <button
                        type="button"
                        onClick={handleDisconnectGithub}
                        className="text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer"
                      >
                        Disconnect GitHub
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="https://github.com/user/project"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>

                {/* Build Command & Output Dir */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Build Command"
                    value={buildCommand}
                    onChange={(e) => setBuildCommand(e.target.value)}
                  />
                  <Input
                    label="Output Directory"
                    value={outputDirectory}
                    onChange={(e) => setOutputDirectory(e.target.value)}
                  />
                </div>

                <Button type="submit" variant="primary" isLoading={savingGeneral} className="h-10 mt-2 self-start text-xs font-bold px-6">
                  Save Settings
                </Button>
              </form>
            </Card>
          )}

          {/* Module 5: Environment Variables Settings Tab */}
          {activeTab === 'env' && (
            <Card className="p-8 border border-white/6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-300 font-heading">Environment Variables</h2>
                  <p className="text-[10px] text-slate-500 mt-1">Configure secret environment keys for serverless runtime.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddEnvRow}>
                  + Add Key
                </Button>
              </div>

              <form onSubmit={handleSaveEnvVars} className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {envVars.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-white/6 bg-slate-950/80">
                      <Input
                        placeholder="KEY"
                        value={item.key}
                        onChange={(e) => handleEnvVarChange(idx, 'key', e.target.value)}
                        className="h-10 font-mono text-xs"
                      />
                      <Input
                        type={item.masked ? 'password' : 'text'}
                        placeholder="VALUE"
                        value={item.value}
                        onChange={(e) => handleEnvVarChange(idx, 'value', e.target.value)}
                        className="h-10 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEnvRow(idx)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 px-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {envVars.length === 0 && (
                    <span className="text-xs text-slate-500 italic py-2">No environment variables defined yet.</span>
                  )}
                </div>

                <Button type="submit" variant="primary" isLoading={savingEnv} className="h-10 mt-3 self-start text-xs font-bold px-6">
                  Save Environment Variables
                </Button>
              </form>
            </Card>
          )}

          {/* Custom Domains Binder */}
          {activeTab === 'domains' && (
            <Card className="p-8 border border-white/6 flex flex-col gap-6">
              <div>
                <h2 className="text-sm font-bold text-slate-300 font-heading">Custom Domains</h2>
                <p className="text-[10px] text-slate-500 mt-1">Bind custom domain names with SSL encryption.</p>
              </div>

              <form onSubmit={handleAddDomain} className="flex gap-3">
                <Input
                  placeholder="app.mycompany.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="h-11"
                />
                <Button type="submit" variant="primary" isLoading={addingDomain} className="px-6 h-11 text-xs whitespace-nowrap">
                  Link Domain
                </Button>
              </form>

              <div className="flex flex-col gap-2.5 border-t border-white/4 pt-5">
                {activeDomains.map((domName: string) => (
                  <div key={domName} className="flex items-center justify-between p-3.5 rounded-xl border border-white/6 bg-white/1">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{domName}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 font-mono">CNAME: cname.deploypilot.ai</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active SSL
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domName)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 cursor-pointer select-none"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {activeDomains.length === 0 && (
                  <span className="text-xs text-slate-500 italic">No custom domains linked yet.</span>
                )}
              </div>
            </Card>
          )}

          {/* Module 6: Danger Zone (Archive & Delete) */}
          {activeTab === 'danger' && (
            <Card className="p-8 border border-red-500/25 bg-red-950/10 flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-bold text-red-400 font-heading">Danger Zone</h2>
                <p className="text-xs text-slate-400 mt-1">Actions in this panel affect project availability and permanent storage.</p>
              </div>

              {/* Archive Project */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-slate-950/60">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Archive Project</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {isArchived ? 'Project is currently archived.' : 'Archive this project to make it read-only.'}
                  </span>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleToggleArchive} className="text-xs">
                  {isArchived ? 'Unarchive Project' : 'Archive Project'}
                </Button>
              </div>

              {/* Delete Project */}
              <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-500/30 bg-red-950/30">
                <span className="text-xs font-bold text-red-300">Permanently Delete Project</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Once deleted, all deployment artifacts, environment secrets, and log telemetry history for "{projectName}" will be permanently removed.
                </p>
                <Button type="button" variant="danger" onClick={handleDelete} className="self-start text-xs font-bold px-5 py-2">
                  Delete Project
                </Button>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
