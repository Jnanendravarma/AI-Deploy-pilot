/**
 * KnowledgeBase.js
 * Error Knowledge Base indexing and search.
 */

const { getSupabaseClient } = require('../config/supabase');
const { mapObjToSnake, mapRowToCamel } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const inMemoryKnowledge = [
  {
    id: 'kb-1',
    errorSignature: 'Cannot find module react-router-dom',
    category: 'Dependency',
    rootCause: 'Missing dependency "react-router-dom" in package.json',
    suggestedFix: 'npm install react-router-dom',
    frequency: 18,
    confidenceScore: 98
  },
  {
    id: 'kb-2',
    errorSignature: 'Docker daemon is unreachable / connect ECONNREFUSED',
    category: 'Docker',
    rootCause: 'Docker Desktop daemon is not running on host',
    suggestedFix: 'Launch Docker Desktop and verify named pipe connection',
    frequency: 14,
    confidenceScore: 97
  },
  {
    id: 'kb-3',
    errorSignature: 'Port conflict EADDRINUSE :::3000',
    category: 'Networking',
    rootCause: 'Host port 3000 is occupied by another active process',
    suggestedFix: 'Rebind container to a free external port or terminate process',
    frequency: 12,
    confidenceScore: 96
  },
  {
    id: 'kb-4',
    errorSignature: 'Missing environment variable DATABASE_URL',
    category: 'Environment',
    rootCause: 'Required DB connection string is missing in project env settings',
    suggestedFix: 'Add DATABASE_URL in Project Settings -> Env Variables',
    frequency: 9,
    confidenceScore: 95
  }
];

async function recordKnowledge(diagnosis) {
  const existing = inMemoryKnowledge.find(
    (k) => k.category === diagnosis.category && k.rootCause === diagnosis.rootCause
  );

  if (existing) {
    existing.frequency += 1;
    return existing;
  }

  const newEntry = {
    id: uuidv4(),
    errorSignature: diagnosis.rootCause,
    category: diagnosis.category || 'Build',
    rootCause: diagnosis.rootCause,
    suggestedFix: Array.isArray(diagnosis.suggestedFixes) ? diagnosis.suggestedFixes.join(' ') : String(diagnosis.suggestedFixes),
    frequency: 1,
    confidenceScore: diagnosis.confidenceScore || 90
  };

  inMemoryKnowledge.push(newEntry);

  try {
    const supabase = getSupabaseClient();
    await supabase.from('knowledge_base').insert([mapObjToSnake(newEntry)]);
  } catch (_) {}

  return newEntry;
}

async function listKnowledgeBase(query = '') {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('knowledge_base').select('*').order('frequency', { ascending: false });
    if (data && data.length > 0) return data.map(mapRowToCamel);
  } catch (_) {}

  if (query) {
    const q = query.toLowerCase();
    return inMemoryKnowledge.filter(
      (k) =>
        k.errorSignature.toLowerCase().includes(q) ||
        k.category.toLowerCase().includes(q) ||
        k.rootCause.toLowerCase().includes(q)
    );
  }

  return inMemoryKnowledge;
}

module.exports = { recordKnowledge, listKnowledgeBase };
