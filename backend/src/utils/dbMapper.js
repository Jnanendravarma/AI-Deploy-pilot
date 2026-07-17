function toCamelCase(str) {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function mapRowToCamel(row) {
  if (!row) return null;
  const res = {};
  for (const key of Object.keys(row)) {
    res[toCamelCase(key)] = row[key];
  }
  if (res.id) {
    res._id = res.id;
  }
  return res;
}

function mapObjToSnake(obj) {
  if (!obj) return null;
  const res = {};
  for (const key of Object.keys(obj)) {
    if (key === '_id') continue;
    res[toSnakeCase(key)] = obj[key];
  }
  return res;
}

function wrapWithSave(data, repository) {
  if (!data) return null;
  const obj = { ...data };
  obj.save = async function () {
    const id = this._id || this.id;
    const updatePayload = { ...this };
    delete updatePayload.save;
    return repository.updateById(id, updatePayload);
  };
  return obj;
}

module.exports = {
  mapRowToCamel,
  mapObjToSnake,
  wrapWithSave
};
