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
    [email]
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
      // status: "active",
      password: hashedPassword,
    }
  );
};

export default {
  findUserByEmail,
  createUser,
};
