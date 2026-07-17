const { getSupabaseClient } = require('../config/supabase');
const { mapRowToCamel, mapObjToSnake, wrapWithSave } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const userRepository = {
  findByEmail: async (email) => {
    if (!email) return null;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), userRepository);
  },

  findById: async (id) => {
    if (!id) return null;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), userRepository);
  },

  create: async (payload) => {
    const supabase = getSupabaseClient();
    const id = uuidv4();
    const record = mapObjToSnake({ ...payload, id });
    
    const { data, error } = await supabase
      .from('users')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), userRepository);
  },

  updateById: async (id, update) => {
    if (!id) return null;
    const supabase = getSupabaseClient();
    const record = mapObjToSnake(update);
    delete record.id; // Do not update primary key

    const { data, error } = await supabase
      .from('users')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), userRepository);
  },

  pushRefreshToken: async (id, token) => {
    const user = await userRepository.findById(id);
    if (!user) return null;
    const refreshTokens = user.refreshTokens || [];
    refreshTokens.push({ token, createdAt: new Date().toISOString() });
    return userRepository.updateById(id, { refreshTokens });
  },

  removeRefreshToken: async (id, token) => {
    const user = await userRepository.findById(id);
    if (!user) return null;
    const refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== token);
    return userRepository.updateById(id, { refreshTokens });
  },

  findByResetToken: async (hash) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_password_token_hash', hash)
      .gt('reset_password_expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), userRepository);
  }
};

module.exports = { userRepository };
