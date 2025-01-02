import logger from "../logger.js";

// TODO:
// import User from "../db/user.js";
// import Session from "../db/session.js";
const User = null;
const Session = null;

export const updateUserInfo = async (req, res, next) => {
  try {
    const { body } = req.xop;
    const { user } = res.locals;

    logger.debug(body);

    // is email available?
    let messageCode = "";
    if (body.email) {
      const userPresentWithEmail = await User.isEmailUsedByAnotherUser({
        email: body.email,
        except_user_uuid: user.uuid,
      });

      logger.debug("email used? ");
      logger.debug(userPresentWithEmail);

      if (userPresentWithEmail.email_used) {
        return next({
          status: 400,
          message: `Email ${body.email} is already in use`,
        });
      }

      Session.deleteSessionsForUser({
        user_uuid: user.uuid,
      });

      messageCode = "RE_LOGIN";
    }

    await User.updateUser({ user_uuid: user.uuid, payload: body });

    return res.json({
      user: { uuid: user.uuid },
      messageCode,
    });
  } catch (error) {
    next(error);
  }
};
