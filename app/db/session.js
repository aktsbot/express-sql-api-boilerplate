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

export default {
  deleteSessionsForUser,
  createSessionForUser,
};
