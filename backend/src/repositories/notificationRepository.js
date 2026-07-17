const { getSupabaseClient } = require('../config/supabase');
const { mapRowToCamel, mapObjToSnake, wrapWithSave } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const notificationRepository = {
  create: async (payload) => {
    const supabase = getSupabaseClient();
    const id = uuidv4();
    const record = mapObjToSnake({ ...payload, id });

    const { data, error } = await supabase
      .from('notifications')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), notificationRepository);
  },

  listByUser: async (userId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []).map((row) => wrapWithSave(mapRowToCamel(row), notificationRepository));
  },

  markRead: async (id, userId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), notificationRepository);
  }
};

module.exports = { notificationRepository };
