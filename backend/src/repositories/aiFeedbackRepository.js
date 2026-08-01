const { getSupabaseClient } = require('../config/supabase');
const { mapObjToSnake, mapRowToCamel, wrapWithSave } = require('../utils/dbMapper');
const { v4: uuidv4 } = require('uuid');

const aiFeedbackRepository = {
  create: async (payload) => {
    const supabase = getSupabaseClient();
    const id = uuidv4();
    const record = mapObjToSnake({ ...payload, id });

    const { data, error } = await supabase
      .from('ai_feedback')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return wrapWithSave(mapRowToCamel(data), aiFeedbackRepository);
  }
};

module.exports = { aiFeedbackRepository };