-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'Developer',
  avatar TEXT,
  oauth_providers JSONB DEFAULT '{}'::jsonb,
  refresh_tokens JSONB DEFAULT '[]'::jsonb,
  reset_password_token_hash TEXT,
  reset_password_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  repository_url TEXT,
  repository_provider TEXT DEFAULT 'manual',
  framework TEXT,
  language TEXT,
  default_branch TEXT DEFAULT 'main',
  metadata JSONB DEFAULT '{}'::jsonb,
  env_vars JSONB DEFAULT '[]'::jsonb,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(owner_id, name)
);

-- Create Deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending',
  commit_sha TEXT,
  branch TEXT,
  image_tag TEXT,
  container_id TEXT,
  health_url TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  build_duration_ms INTEGER DEFAULT 0,
  retry_of_deployment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Deployment Errors table
CREATE TABLE IF NOT EXISTS deployment_errors (
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  root_cause TEXT NOT NULL,
  possible_causes JSONB DEFAULT '[]'::jsonb,
  confidence_score NUMERIC,
  suggested_fix TEXT,
  documentation_link TEXT,
  severity TEXT DEFAULT 'Medium',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create AI Diagnoses table
CREATE TABLE IF NOT EXISTS ai_diagnoses (
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  category TEXT DEFAULT 'Build',
  severity TEXT DEFAULT 'Medium',
  confidence_score INTEGER DEFAULT 95,
  root_cause TEXT NOT NULL,
  human_explanation TEXT NOT NULL,
  affected_files JSONB DEFAULT '[]'::jsonb,
  suggested_fixes JSONB DEFAULT '[]'::jsonb,
  estimated_fix_time TEXT DEFAULT '2 mins',
  auto_fixable BOOLEAN DEFAULT false,
  auto_fix_action JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Fix Recommendations table
CREATE TABLE IF NOT EXISTS fix_recommendations (
  id TEXT PRIMARY KEY,
  diagnosis_id TEXT NOT NULL REFERENCES ai_diagnoses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'command',
  confidence NUMERIC DEFAULT 95,
  is_safe BOOLEAN DEFAULT true,
  command TEXT,
  file_path TEXT,
  line_number INTEGER,
  old_code TEXT,
  new_code TEXT,
  docs_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Error Categories table
CREATE TABLE IF NOT EXISTS error_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  count INTEGER DEFAULT 0
);

-- Create Knowledge Base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY,
  error_signature TEXT NOT NULL,
  category TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  suggested_fix TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  confidence_score INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create AI Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deployment_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create AI Feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  deployment_id TEXT REFERENCES deployments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 5,
  category TEXT DEFAULT 'general',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Deployment Reports table
CREATE TABLE IF NOT EXISTS deployment_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deployment_id TEXT REFERENCES deployments(id) ON DELETE CASCADE,
  health_score INTEGER DEFAULT 90,
  summary TEXT NOT NULL,
  report_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Deployment Logs table
CREATE TABLE IF NOT EXISTS deployment_logs (
  id TEXT PRIMARY KEY,
  deployment_id TEXT NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'info',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  provider TEXT DEFAULT 'github',
  role TEXT DEFAULT 'developer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_deployment_id ON ai_diagnoses(deployment_id);
CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_project_id ON ai_diagnoses(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_deployment_id ON ai_feedback(deployment_id);
