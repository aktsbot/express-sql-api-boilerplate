import pino from "pino";

import config from "./config.js";

// One of 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'.
const loggerConfig = {
  level: config.env === "development" ? "debug" : "info",
};

export default pino(loggerConfig);
