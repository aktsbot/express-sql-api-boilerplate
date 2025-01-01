import db from "./index.js";
import { getUuid, getPasswordHash } from "../utils.js";

const findUserByEmail = ({ email, attributes = [] }) => {
  // default argument list
  let attributeSql = `uuid, full_name, status,
  email, created_at, updated_at`;

  // only fetch these if mentioned
  if (attributes.length) {
    attributeSql = attributes.join(",");
  }
  return db.get(
    `SELECT 
    ${attributeSql}
    FROM users WHERE email=?`,
    [email],
  );
};

const findUserByUuid = ({ uuid, attributes = [] }) => {
  // default argument list
  let attributeSql = `uuid, full_name, status,
  email, created_at, updated_at`;

  // only fetch these if mentioned
  if (attributes.length) {
    attributeSql = attributes.join(",");
  }
  return db.get(
    `SELECT 
    ${attributeSql}
    FROM users WHERE uuid=?`,
    [uuid],
  );
};

const createUser = async ({ email, fullName, password }) => {
  const hashedPassword = await getPasswordHash({ password });
  return db.run(
    `INSERT INTO users (uuid, email, full_name, password) VALUES (@uuid, @email, @fullName, @password)`,
    {
      uuid: getUuid(),
      email,
      fullName,
      password: hashedPassword,
    },
  );
};

const updateUserPassword = async ({ user_uuid, password }) => {
  const hashedPassword = await getPasswordHash({ password });

  return db.run(`UPDATE users SET password=@password WHERE uuid=@uuid`, {
    uuid: user_uuid,
    password: hashedPassword,
  });
};

export default {
  findUserByEmail,
  findUserByUuid,
  createUser,
  updateUserPassword,
};
