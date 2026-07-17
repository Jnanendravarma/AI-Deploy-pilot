const { getSupabaseClient } = require('../config/supabase');
const { mapRowToCamel, mapObjToSnake, wrapWithSave } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const deploymentErrorRepository = {
  create: async (payload) => {
    const supabase = getSupabaseClient();
    const id = uuidv4();
    const record = mapObjToSnake({ ...payload, id });

    const { data, error } = await supabase
      .from('deployment_errors')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), deploymentErrorRepository);
  },

  listByProject: async (projectId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('deployment_errors')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => wrapWithSave(mapRowToCamel(row), deploymentErrorRepository));
  },

  resolve: async (id) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('deployment_errors')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), deploymentErrorRepository);
  },

  findByDeploymentId: async (deploymentId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('deployment_errors')
      .select('*')
      .eq('deployment_id', deploymentId)
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), deploymentErrorRepository);
  },

  topErrors: async (ownerProjectIds) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('deployment_errors')
      .select('root_cause')
      .in('project_id', ownerProjectIds);

    if (error) throw error;

    const counts = {};
    (data || []).forEach((row) => {
      counts[row.root_cause] = (counts[row.root_cause] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([rootCause, count]) => ({ _id: rootCause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return sorted;
  }
};

module.exports = { deploymentErrorRepository };
