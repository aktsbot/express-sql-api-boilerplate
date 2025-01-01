import logger from "../logger.js";

export const notFound = (req, res, next) => {
  next({
    status: 404,
    message: "Resource not found",
  });
};

export const errorHandler = (error, req, res, next) => {
  let status = error.status || 500;
  let message = error.message || "";
  let errors = error.errors || [];
  let messageCode = error.messageCode || "";

  logger.debug(error);

  return res.status(status).json({
    message,
    errors,
    messageCode,
  });
};
