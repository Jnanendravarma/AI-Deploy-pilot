const { getSupabaseClient } = require('../config/supabase');
const { mapRowToCamel, mapObjToSnake, wrapWithSave } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const deploymentRepository = {
  create: async (payload) => {
    const supabase = getSupabaseClient();
    const id = uuidv4();
    const record = mapObjToSnake({ ...payload, id });

    const { data, error } = await supabase
      .from('deployments')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), deploymentRepository);
  },

  findById: async (id) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), deploymentRepository);
  },

  listByProject: async (projectId, options = {}) => {
    const supabase = getSupabaseClient();
    const { page = 1, limit = 20, status } = options;
    
    let query = supabase
      .from('deployments')
      .select('*')
      .eq('project_id', projectId);

    if (status) {
      query = query.eq('status', status);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;
    return (data || []).map((row) => wrapWithSave(mapRowToCamel(row), deploymentRepository));
  },

  updateById: async (id, update) => {
    const supabase = getSupabaseClient();
    const record = mapObjToSnake(update);
    delete record.id;

    const { data, error } = await supabase
      .from('deployments')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), deploymentRepository);
  },

  listByProjectIds: async (projectIds) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .in('project_id', projectIds);

    if (error) throw error;
    return (data || []).map((row) => wrapWithSave(mapRowToCamel(row), deploymentRepository));
  }
};

module.exports = { deploymentRepository };
