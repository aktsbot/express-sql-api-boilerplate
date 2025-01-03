import { Sequelize } from "sequelize";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import config from "../config.js";
import logger from "../logger.js";

// stuff that used to be in node globals, ugh!
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const db = {
  isClosed: false,
};
let sequelize = null;

let sequelizeOptions = {
  logging: false,
};

// show queries only in development mode
if (config.env === "development") {
  sequelizeOptions.logging = (msg) => logger.debug(msg);
}

if (config.sqlite.dbPath) {
  logger.info("app is going to use sqlite as database");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: config.sqlite.dbPath,
    ...sequelizeOptions,
  });
} else {
  logger.info("app is going to use postgres as database");
  // postgres
  sequelize = new Sequelize(
    `postgres://${config.postgres.username}:${config.postgres.password}@${config.postgres.host}:${config.postgres.port}/${config.postgres.dbname}`,
    { ...sequelizeOptions }
  );
}

// We use this loadModels function to hook up the models and
// set their association because of the await import()
//
async function loadModels() {
  const modelFiles = fs.readdirSync(`${__dirname}/models`).filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  });

  for (const file of modelFiles) {
    const modelImport = await import(path.join(__dirname, "models", file));
    const model = modelImport.default(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  }

  // set associations for models
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
}
loadModels();

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info("database connection has been established successfully");
    db.isClosed = false;
  } catch (error) {
    logger.error("unable to connect to the database");
    logger.error(error);
  }
};

export const closeDB = async () => {
  if (db.isClosed) {
    logger.info("database connection is already closed");
    return;
  }
  try {
    await sequelize.close();
    logger.info("database connection has been closed");
    db.isClosed = true;
  } catch (error) {
    logger.error("unable to close database connection");
    logger.error(error);
  }
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
