const { getSupabaseClient } = require('../config/supabase');
const { mapRowToCamel, mapObjToSnake, wrapWithSave } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const projectRepository = {
  create: async (payload) => {
    const supabase = getSupabaseClient();
    const id = uuidv4();
    const record = mapObjToSnake({ ...payload, id });

    const { data, error } = await supabase
      .from('projects')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), projectRepository);
  },

  listByOwner: async (ownerId, filter = {}) => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('projects')
      .select('*')
      .eq('owner_id', ownerId);

    if (filter.archived !== undefined) {
      query = query.eq('archived', filter.archived);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => wrapWithSave(mapRowToCamel(row), projectRepository));
  },

  findById: async (id) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), projectRepository);
  },

  findByIdAndOwner: async (id, ownerId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), projectRepository);
  },

  updateByIdAndOwner: async (id, ownerId, update) => {
    const supabase = getSupabaseClient();
    const record = mapObjToSnake(update);
    delete record.id;
    delete record.owner_id;

    const { data, error } = await supabase
      .from('projects')
      .update(record)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), projectRepository);
  },

  updateById: async (id, update) => {
    const supabase = getSupabaseClient();
    const record = mapObjToSnake(update);
    delete record.id;

    const { data, error } = await supabase
      .from('projects')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), projectRepository);
  },

  deleteByIdAndOwner: async (id, ownerId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return mapRowToCamel(data);
  },

  countByOwner: async (ownerId) => {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', ownerId)
      .eq('archived', false);

    if (error) throw error;
    return count || 0;
  }
};

module.exports = { projectRepository };
