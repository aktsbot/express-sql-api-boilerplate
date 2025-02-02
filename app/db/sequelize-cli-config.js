// Note: this file is ONLY read by the sequelize cli
import "dotenv/config";
import config from "../config.js";

let sequelizeConfig = null;

if (config.sqlite.dbPath) {
  console.log("sequelize-cli is going to use sqlite as database\n");
  sequelizeConfig = {
    dialect: "sqlite",
    storage: config.sqlite.dbPath,
  };
} else {
  console.log("sequelize-cli is going to use postgres as database\n");
  sequelizeConfig = {
    username: config.postgres.username,
    password: config.postgres.password,
    database: config.postgres.dbname,
    host: config.postgres.host,
    port: config.postgres.port,
    dialect: "postgres",
  };
}

export default {
  development: {
    ...sequelizeConfig,
  },
  production: {
    ...sequelizeConfig,
  },
};
