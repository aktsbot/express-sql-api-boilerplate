import db from "./index.js";

const deleteSessionsForUser = ({ user_uuid }) => {
  return db.run(`DELETE FROM sessions where user = @user_uuid`, { user_uuid });
};

export default {
  deleteSessionsForUser,
};
