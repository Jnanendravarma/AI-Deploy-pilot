const { ApiError } = require('../errors/ApiError');

function validateRequest(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate({
      body: req.body,
      params: req.params,
      query: req.query
    }, { abortEarly: false });

    if (error) {
      return next(new ApiError(400, 'Validation failed', error.details.map((d) => d.message)));
    }

    req.body = value.body;
    req.params = value.params;
    req.query = value.query;
    return next();
  };
}

module.exports = { validateRequest };
