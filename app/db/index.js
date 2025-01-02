import { Sequelize } from "sequelize";

import config from "../config.js";
import logger from "../logger.js";

let sequelize = null;

let sequelizeOptions = {
  logging: false,
};

// show queries only in development mode
if (config.env === "development") {
  sequelizeOptions.logging = (msg) => logger.debug(msg);
}

if (config.sqlite.dbPath) {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: config.sqlite.dbPath,
    ...sequelizeOptions,
  });
} else {
  // postgres
  sequelize = new Sequelize(
    `postgres://${config.postgres.username}:${config.postgres.password}@${config.postgres.host}:${config.postgres.port}/${config.postgres.dbname}`,
    { ...sequelizeOptions }
  );
}

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info("database connection has been established successfully");
  } catch (error) {
    logger.error("unable to connect to the database");
    logger.error(error);
  }
};

export const closeDB = async () => {
  try {
    await sequelize.close();
    logger.info("database connection has been closed");
  } catch (error) {
    logger.error("unable to close database connection");
    logger.error(error);
  }
};

export default {
  sequelize,
  Sequelize,
};
