/**
 * Zod validation middleware factory.
 * Pass a Zod schema and it validates req.body before the controller runs.
 *
 * Usage in routes:
 *   router.post('/', validate(mySchema), controller.handle);
 */
function validate(schema) {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

module.exports = { validate };
