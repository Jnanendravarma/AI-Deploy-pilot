const { getSupabaseClient } = require('../config/supabase');
const { mapRowToCamel, mapObjToSnake, wrapWithSave } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const deploymentLogRepository = {
  create: async (payload) => {
    const supabase = getSupabaseClient();
    const id = uuidv4();
    const record = mapObjToSnake({ ...payload, id });

    const { data, error } = await supabase
      .from('deployment_logs')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), deploymentLogRepository);
  },

  listByDeployment: async (deploymentId, query = {}) => {
    const supabase = getSupabaseClient();
    const { search, level, page = 1, limit = 100 } = query;

    let dbQuery = supabase
      .from('deployment_logs')
      .select('*')
      .eq('deployment_id', deploymentId);

    if (level) {
      dbQuery = dbQuery.eq('level', level);
    }

    if (search) {
      dbQuery = dbQuery.ilike('message', `%${search}%`);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error } = await dbQuery
      .order('created_at', { ascending: true })
      .range(start, end);

    if (error) throw error;
    return (data || []).map((row) => wrapWithSave(mapRowToCamel(row), deploymentLogRepository));
  }
};

module.exports = { deploymentLogRepository };
