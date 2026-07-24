import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { projectApi, deploymentApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { FRAMEWORKS, autoDetectFramework } from '../../utils/frameworkDetector';
import type { FrameworkInfo } from '../../utils/frameworkDetector';

interface EnvVar {
  id: string;
  key: string;
  value: string;
  masked: boolean;
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { addProject, triggerToast } = useProjects();

  const [sourceType, setSourceType] = useState<'github' | 'zip'>('github');
  const [githubUrl, setGithubUrl] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const [selectedFrameworkKey, setSelectedFrameworkKey] = useState<string>('react');
  const [detectedFramework, setDetectedFramework] = useState<FrameworkInfo>(FRAMEWORKS.react);
  const [manualOverride, setManualOverride] = useState(false);

  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-detect framework when githubUrl or zipFile name changes (unless manually overridden)
  useEffect(() => {
    if (manualOverride) return;
    const input = sourceType === 'github' ? githubUrl : zipFile?.name || '';
    if (input.trim()) {
      const detected = autoDetectFramework(input);
      setDetectedFramework(detected);
      setSelectedFrameworkKey(detected.key);
    }
  }, [githubUrl, zipFile, sourceType, manualOverride]);

  const handleGithubUrlChange = (val: string) => {
    setGithubUrl(val);
    if (!projectName && val.trim()) {
      const parts = val.trim().split('/');
      const repoName = parts[parts.length - 1] || parts[parts.length - 2] || '';
      if (repoName) {
        setProjectName(repoName.replace(/\.git$/, ''));
        setProjectNameError('');
      }
    }
  };

  const handleZipFileDrop = (file: File) => {
    if (!file.name.endsWith('.zip')) {
      triggerToast('Please upload a valid .zip archive file', 'error');
      return;
    }
    setZipFile(file);
    if (!projectName) {
      setProjectName(file.name.replace(/\.zip$/i, ''));
      setProjectNameError('');
    }
    triggerToast(`ZIP file selected: ${file.name}`, 'success');
  };

  const handleAddEnv = () => {
    setEnvVars((prev) => [...prev, { id: Math.random().toString(36).substring(2, 9), key: '', value: '', masked: true }]);
  };

  const handleRemoveEnv = (id: string) => {
    setEnvVars((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEnvChange = (id: string, field: 'key' | 'value', val: string) => {
    setEnvVars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleToggleMask = (id: string) => {
    setEnvVars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, masked: !item.masked } : item))
    );
  };

  const handleApplyBulkPaste = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    const parsed: EnvVar[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const k = trimmed.substring(0, eqIdx).trim();
        const v = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (k) {
          parsed.push({
            id: Math.random().toString(36).substring(2, 9),
            key: k,
            value: v,
            masked: true
          });
        }
      }
    });

    if (parsed.length > 0) {
      setEnvVars((prev) => [...prev, ...parsed]);
      triggerToast(`Imported ${parsed.length} environment variables`, 'success');
    }
    setBulkText('');
    setShowBulkPaste(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setProjectNameError('Please specify a project name');
      return;
    }

    if (sourceType === 'github' && !githubUrl.trim()) {
      triggerToast('Please provide a valid GitHub Repository URL', 'error');
      return;
    }

    if (sourceType === 'zip' && !zipFile) {
      triggerToast('Please select or drop a ZIP project file', 'error');
      return;
    }

    const frameworkObj = FRAMEWORKS[selectedFrameworkKey] || detectedFramework;

    try {
      setSubmitting(true);
      triggerToast(`Initializing ${frameworkObj.name} project pipeline...`, 'success');

      let createdProjectId = '';

      if (sourceType === 'zip' && zipFile) {
        const formData = new FormData();
        formData.append('file', zipFile);
        formData.append('name', projectName.toLowerCase().trim());
        formData.append('visibility', visibility);
        formData.append('framework', frameworkObj.name);
        formData.append('envVars', JSON.stringify(envVars.map(e => ({ key: e.key, value: e.value }))));

        const res = await projectApi.upload(formData);
        createdProjectId = String(res.data._id || res.data.id);
      } else if (sourceType === 'github') {
        const res = await projectApi.importGithub({
          name: projectName.toLowerCase().trim(),
          repositoryUrl: githubUrl.trim(),
          visibility,
          frameworkHint: frameworkObj.name,
          envVars: envVars.map(e => ({ key: e.key, value: e.value }))
        });
        createdProjectId = String(res.data._id || res.data.id);
      } else {
        createdProjectId = await addProject(projectName, frameworkObj.name, envVars.map(e => ({ key: e.key, value: e.value })));
      }

      if (!createdProjectId) {
        throw new Error('Project initialization failed');
      }

      // Trigger initial deployment
      const deploymentRes = await deploymentApi.create({ projectId: createdProjectId });
      triggerToast('Deployment pipeline launched!', 'success');
      navigate(`/deployment?projectId=${createdProjectId}&deploymentId=${String(deploymentRes.data._id || deploymentRes.data.id)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create project deployment';
      triggerToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentFw = FRAMEWORKS[selectedFrameworkKey] || detectedFramework;

  return (
    <div className="flex flex-col gap-6 select-none max-w-6xl mx-auto">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Deploy a New Project</h1>
          <p className="text-xs text-slate-400 mt-1">Import a GitHub repository or upload a ZIP package to launch autonomous edge nodes.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Source Selection & Framework Detection */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Module 3: Source Selection */}
          <Card className="p-6 border border-white/6 flex flex-col gap-5">
            <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-xs">1</span>
              Select Project Source
            </h2>

            {/* Tabs for GitHub vs ZIP */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/6">
              <button
                type="button"
                onClick={() => setSourceType('github')}
                className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  sourceType === 'github'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub Repo URL
              </button>

              <button
                type="button"
                onClick={() => setSourceType('zip')}
                className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  sourceType === 'zip'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                ZIP Archive Upload
              </button>
            </div>

            {sourceType === 'github' ? (
              <Input
                label="GitHub Repository URL"
                placeholder="https://github.com/username/my-app"
                value={githubUrl}
                onChange={(e) => handleGithubUrlChange(e.target.value)}
                icon={(
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
              />
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleZipFileDrop(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-white/15 hover:border-primary/50 bg-slate-950/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.zip';
                  input.onchange = (e: any) => {
                    if (e.target.files && e.target.files[0]) {
                      handleZipFileDrop(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-primary/20 text-slate-400 group-hover:text-primary flex items-center justify-center transition-all mb-3">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                {zipFile ? (
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-emerald-400">{zipFile.name}</span>
                    <span className="text-xs text-slate-500 mt-1">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-bold text-slate-200">Drag & Drop project `.zip` file here</span>
                    <span className="text-[11px] text-slate-500 mt-1">or click to browse local filesystem</span>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Module 4: Framework Detection Engine */}
          <Card className="p-6 border border-white/6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
                Framework Detection
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Auto-Detected
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-slate-950/80">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentFw.iconBg} border border-white/10 flex items-center justify-center font-bold text-lg text-white`}>
                {currentFw.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{currentFw.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${currentFw.badgeColor}`}>
                    {currentFw.language}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  Build: <code className="text-slate-200 bg-white/5 px-1.5 py-0.5 rounded text-[11px]">{currentFw.defaultBuildCmd}</code>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              <label className="text-xs font-semibold text-slate-400">Override Framework Preset</label>
              <select
                value={selectedFrameworkKey}
                onChange={(e) => {
                  setSelectedFrameworkKey(e.target.value);
                  setManualOverride(true);
                }}
                className="h-11 w-full rounded-xl bg-slate-950 border border-white/10 text-xs text-white px-3 focus:outline-none focus:border-primary cursor-pointer"
              >
                {Object.values(FRAMEWORKS).map((fw) => (
                  <option key={fw.key} value={fw.key}>
                    {fw.name} ({fw.language})
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </div>

        {/* Right Column: Project Details & Environment Variables */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Module 1: Project Details */}
          <Card className="p-6 border border-white/6 flex flex-col gap-5">
            <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">3</span>
              Project Details & Visibility
            </h2>

            <Input
              id="project-name-input"
              label="Project Name"
              placeholder="e.g. ecommerce-api"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setProjectNameError('');
              }}
              error={projectNameError}
            />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400">Project Access & Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    visibility === 'public'
                      ? 'bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                      : 'bg-slate-950 border-white/8 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold font-heading text-white">Public</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Accessible to deployment links and public APIs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    visibility === 'private'
                      ? 'bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                      : 'bg-slate-950 border-white/8 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold font-heading text-white">Private</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Restricted access requiring authorization token</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Module 5: Environment Variables */}
          <Card className="p-6 border border-white/6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
                Environment Variables
              </h2>

              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowBulkPaste(!showBulkPaste)}>
                  {showBulkPaste ? 'Close Paste' : 'Bulk Paste .env'}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddEnv}>
                  + Add Key
                </Button>
              </div>
            </div>

            {/* Bulk Paste Dropdown */}
            {showBulkPaste && (
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 flex flex-col gap-3">
                <span className="text-xs font-semibold text-slate-300">Paste your `.env` content below:</span>
                <textarea
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`DATABASE_URL=postgres://user:pass@host/db\nJWT_SECRET=supersecretkey\nAPI_KEY=xyz123`}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-primary"
                />
                <Button type="button" variant="primary" size="sm" onClick={handleApplyBulkPaste} className="self-end text-xs">
                  Parse & Import Key-Values
                </Button>
              </div>
            )}

            {/* Key Value Rows */}
            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {envVars.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-white/6 bg-slate-950/60">
                  <input
                    type="text"
                    placeholder="DATABASE_URL"
                    value={item.key}
                    onChange={(e) => handleEnvChange(item.id, 'key', e.target.value)}
                    className="w-1/2 bg-slate-900 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary"
                  />
                  <div className="relative w-1/2">
                    <input
                      type={item.masked ? 'password' : 'text'}
                      placeholder="secret_value"
                      value={item.value}
                      onChange={(e) => handleEnvChange(item.id, 'value', e.target.value)}
                      className="w-full bg-slate-900 border border-white/8 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleMask(item.id)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      {item.masked ? '👁️' : '🔒'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(item.id)}
                    className="text-xs font-bold text-red-400 hover:text-red-300 px-2 py-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {envVars.length === 0 && !showBulkPaste && (
                <span className="text-xs text-slate-500 italic py-2">No environment variables added. Click "+ Add Key" or "Bulk Paste .env" to include secrets.</span>
              )}
            </div>

            {/* Launch Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              className="h-12 w-full mt-3 font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              🚀 Initialize & Deploy Project
            </Button>
          </Card>

        </div>

      </form>
    </div>
  );
};
