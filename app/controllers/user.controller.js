import { Op } from "sequelize";

import logger from "../logger.js";

import db from "../db/index.js";

export const updateUserInfo = async (req, res, next) => {
  try {
    const { body } = req.xop;
    const { user } = res.locals;

    logger.debug(body);

    // is email available?
    let messageCode = "";
    let message = "Your info has been updated";
    if (body.email && user.email !== body.email) {
      const userPresentWithEmail = await db.User.count({
        where: {
          email: body.email,
          [Op.not]: {
            uuid: user.uuid,
          },
        },
      });

      logger.debug("email used? ");
      logger.debug(userPresentWithEmail);

      if (userPresentWithEmail) {
        return next({
          status: 400,
          message: `Email ${body.email} is already in use`,
        });
      }

      // email changed, so trigger a new login from client side.
      await db.Session.destroy({
        where: {
          user: user.uuid,
        },
      });

      messageCode = "RE_LOGIN";
      message = "Your email was updated. Please login";
    }

    await db.User.update(
      { ...body },
      {
        where: {
          uuid: user.uuid,
        },
      }
    );

    return res.json({
      user: { uuid: user.uuid },
      message,
      messageCode,
    });
  } catch (error) {
    next(error);
  }
};
