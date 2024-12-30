import sqlite from "better-sqlite3";
import path from "path";

import config from "../config.js";
import logger from "../logger.js";

const db = new sqlite(path.resolve(config.dbPath), { fileMustExist: true });

const query = (sql, params = []) => {
  return db.prepare(sql).all(params);
};

const get = (sql, params = []) => {
  return db.prepare(sql).get(params);
};

const run = (sql, params) => {
  return db.prepare(sql).run(params);
};

const checkDB = () => {
  logger.info("running test query for db connectivity");
  try {
    const resp = get(`SELECT 1+1 as result`, []);
    if (resp && resp.result == 2) {
      logger.info("db connection looks good");
    }
  } catch (error) {
    logger.error("db connection failed");
    logger.error(error.message);
    process.exit(1);
  }
};

const closeDB = () => {
  db.close();
};

export default {
  query,
  get,
  run,

  checkDB,
  closeDB,
};
