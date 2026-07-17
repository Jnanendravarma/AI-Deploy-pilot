function sendSuccess(res, data, message = 'OK', statusCode = 200, meta = undefined) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta
  });
}

function sendError(res, message, statusCode = 500, details = undefined) {
  return res.status(statusCode).json({
    success: false,
    message,
    details
  });
}

module.exports = { sendSuccess, sendError };
