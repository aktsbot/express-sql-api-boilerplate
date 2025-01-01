import db from "./index.js";
import { getUuid } from "../utils.js";

const deleteSessionsForUser = ({ user_uuid }) => {
  return db.run(`DELETE FROM sessions where user = @user_uuid`, { user_uuid });
};

const createSessionForUser = ({ user, is_valid, uuid }) => {
  return db.run(
    `INSERT INTO sessions (uuid, user, is_valid) VALUES (@uuid, @user, @is_valid)`,
    {
      uuid: uuid || getUuid(),
      user,
      is_valid,
    }
  );
};

const findUserForValidSession = ({ session_uuid }) => {
  return db.get(
    `SELECT
    u.uuid as user_uuid,
    u.full_name as user_full_name,
    u.email as user_email
  FROM
    sessions s
  INNER JOIN users u on
    s.user = u.uuid
  WHERE
    s.uuid = ?
    AND s.is_valid = 1
    AND u.status = 'active';
  `,
    [session_uuid]
  );
};

export default {
  deleteSessionsForUser,
  createSessionForUser,
  findUserForValidSession,
};
