import logger from "../logger.js";

// TODO:
// import User from "../models/user.model.js";
// import Session from "../models/session.model.js";
const Session = null;
const User = null;

export const updateUserInfo = async (req, res, next) => {
  try {
    const { body } = req.xop;
    const { user } = res.locals;

    logger.debug(body);

    // is email available?
    let messageCode = "";
    if (body.email) {
      const userPresentWithEmail = await User.findOne({
        email: body.email,
        _id: {
          $ne: user._id,
        },
      });

      if (userPresentWithEmail) {
        return next({
          status: 400,
          message: `Email ${body.email} is already in use`,
        });
      }

      await Session.deleteMany({
        user: user._id,
      });

      messageCode = "RE_LOGIN";
    }

    const userUpdate = await User.findByIdAndUpdate(user._id, body, {
      new: true,
    });

    return res.json({
      user: { uuid: userUpdate.uuid },
      messageCode,
    });
  } catch (error) {
    next(error);
  }
};
