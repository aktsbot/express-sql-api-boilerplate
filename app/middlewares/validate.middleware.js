export const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (error) {
    return next({
      status: 400,
      message: "Payload validation errors",
      errors: [error],
    });
  }

  if (value) {
    req.xop = { ...value };
  }

  next();
};
