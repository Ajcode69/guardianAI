const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
  }

  console.error('❌', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
