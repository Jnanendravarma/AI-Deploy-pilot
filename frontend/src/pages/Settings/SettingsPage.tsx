import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { deleteProject, triggerToast, projects, updateProjectSettings, user, logout } = useProjects();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId') || '';
  const tabParam = queryParams.get('tab') || '';
  const currentProject = projects.find((project) => project._id === projectId);
  const projectName = currentProject?.name || 'project';

  const [activeTab, setActiveTab] = useState<'general' | 'domains' | 'collabs' | 'danger' | 'account'>(
    (tabParam === 'account' || !projectId) ? 'account' : 'general'
  );
  
  // General settings state
  const [buildCommand, setBuildCommand] = useState(currentProject?.metadata?.buildCommand || 'npm run build');
  const [outputDirectory, setOutputDirectory] = useState(currentProject?.metadata?.outputDirectory || 'out');
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Domains state
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  const activeDomains = currentProject?.metadata?.domains || [];

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setSavingGeneral(true);
    try {
      await updateProjectSettings(projectId, {
        metadata: {
          buildCommand,
          outputDirectory
        }
      });
      triggerToast('General configurations saved to database', 'success');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !projectId) return;

    const domainName = newDomain.toLowerCase().trim();
    if (activeDomains.includes(domainName)) {
      triggerToast('Domain is already linked to this project', 'error');
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
      triggerToast(`Custom domain linked: ${domainName}`, 'success');
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
    const confirm = window.confirm(`Are you absolutely sure you want to delete project: ${projectName}? This action is irreversible.`);
    if (confirm) {
      if (!projectId) {
        triggerToast('Project ID missing', 'error');
        return;
      }
      void deleteProject(projectId).then(() => navigate('/dashboard'));
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      
      {/* Page Title */}
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
            <span>Manage your user profile credentials and security settings.</span>
          ) : (
            <span>Configure project variables, DNS credentials, collaborators, and danger settings.</span>
          )}
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Tab selectors */}
        <div className="lg:col-span-3 flex flex-row overflow-x-auto lg:flex-col gap-1.5 pb-2.5 lg:pb-0 scrollbar-none select-none">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-center lg:text-left px-4 py-3 rounded-xl transition border cursor-pointer ${
              activeTab === 'account'
                ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_10px_rgba(99,102,241,0.05)]'
                : 'bg-transparent border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            Account Settings
          </button>

          {projectId && (['general', 'domains', 'collabs', 'danger'] as const).map((tab) => {
            const labels = {
              general: 'General Settings',
              domains: 'Custom Domains',
              collabs: 'Collaborators',
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

        {/* Right Content Cards */}
        <div className="lg:col-span-9">
          
          {/* Account Profile Settings */}
          {activeTab === 'account' && (
            <Card className="p-8 border border-white/6 flex flex-col gap-6">
              <div>
                <h2 className="text-sm font-bold text-slate-300 font-heading">Account Profile</h2>
                <p className="text-[10px] text-slate-500 mt-1">Manage your developer profile and account credentials.</p>
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-primary/10 text-primary border-primary/20 mt-1.5 w-max">
                      {user?.role || 'Developer'} Account
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Name" value={user?.name || ''} disabled className="opacity-60" />
                  <Input label="Email Address" value={user?.email || ''} disabled className="opacity-60" />
                </div>

                <div className="border-t border-white/5 pt-5 mt-2 flex justify-start">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="px-5 py-2 h-10 text-xs font-semibold flex items-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout Account
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="p-8 border border-white/6 flex flex-col gap-6">
              <h2 className="text-sm font-bold text-slate-300 font-heading">General Settings</h2>
              <form onSubmit={handleSaveGeneral} className="flex flex-col gap-4">
                <Input label="General Project Name" value={projectName} disabled className="opacity-60" />
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
                <Button type="submit" variant="primary" isLoading={savingGeneral} className="h-10 mt-2 self-start text-xs">
                  Save Changes
                </Button>
              </form>
            </Card>
          )}

          {/* Custom Domains */}
          {activeTab === 'domains' && (
            <Card className="p-8 border border-white/6 flex flex-col gap-6">
              <div>
                <h2 className="text-sm font-bold text-slate-300 font-heading">Custom Domains Binder</h2>
                <p className="text-[10px] text-slate-500 mt-1">Bind custom domain names and manage automated SSL certification.</p>
              </div>

              <form onSubmit={handleAddDomain} className="flex gap-3">
                <Input
                  placeholder="shop.mysite.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="h-11"
                />
                <Button type="submit" variant="primary" isLoading={addingDomain} className="px-6 h-11 text-xs whitespace-nowrap">
                  Link Domain
                </Button>
              </form>

              <div className="flex flex-col gap-2.5 border-t border-white/4 pt-5">
                {activeDomains.map((domName: string) => {
                  return (
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
                  );
                })}
                {activeDomains.length === 0 && (
                  <span className="text-xs text-slate-500 italic">No custom domains mapped yet.</span>
                )}
              </div>
            </Card>
          )}

          {/* Collaborators */}
          {activeTab === 'collabs' && (
            <Card className="p-8 border border-white/6 flex flex-col gap-6">
              <h2 className="text-sm font-bold text-slate-300 font-heading">Collaborators Settings</h2>
              <form onSubmit={(e) => { e.preventDefault(); triggerToast('Invitation email sent!', 'success'); }} className="flex gap-3">
                <Input placeholder="colleague@company.com" type="email" required className="h-11" />
                <Button type="submit" variant="primary" className="px-6 h-11 text-xs whitespace-nowrap">
                  Send Invite
                </Button>
              </form>

              <div className="flex flex-col gap-2.5 border-t border-white/4 pt-5">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/6 bg-white/1">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Sarah Connor</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 font-mono">sarah@skynet.com</span>
                  </div>
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold px-2 py-0.5 rounded">Owner</span>
                </div>
              </div>
            </Card>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <Card className="p-8 border border-red-500/25 bg-red-950/5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-red-400 font-heading">Danger Zone</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Once you delete a project, all of its active edge deployments, environment variables, cache indices, and telemetry log history will be permanently deleted. This action is irreversible.
              </p>
              
              <Button type="button" variant="danger" onClick={handleDelete} className="self-start text-xs font-bold px-5 py-2.5">
                Delete This Project
              </Button>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
