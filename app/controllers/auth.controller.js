import logger from "../logger.js";

import { makeToken, verifyJWT } from "../jwt.js";
import { sendForgotPasswordEmail } from "../email.js";

import db from "../db/index.js";

export const signupUser = async (req, res, next) => {
  try {
    const { body } = req.xop;
    const userPresent = await db.User.findOne({
      where: {
        email: body.email,
      },
      attributes: ["uuid"],
    });

    if (userPresent) {
      return next({
        status: 409,
        message: `User with email ${body.email} already exists`,
      });
    }

    const user = await db.User.create({ ...body });

    return res.json({
      user: {
        uuid: user.uuid,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const errorMessage = "Invalid email or password";

    const { body } = req.xop;
    const userPresent = await db.User.findOne({
      where: {
        email: body.email,
      },
      attributes: ["uuid", "password", "email", "fullName", "status"],
    });

    if (!userPresent) {
      return next({
        status: 401,
        message: errorMessage,
      });
    }

    const isPasswordValid = await userPresent.isValidPassword(body.password);

    logger.debug(`password valid ${isPasswordValid}`);

    if (!isPasswordValid) {
      return next({
        status: 401,
        message: errorMessage,
      });
    }

    if (userPresent.status !== "active") {
      return next({
        status: 401,
        message: "User is not active",
      });
    }

    const session = await db.Session.create({
      user: userPresent.uuid,
      isValid: 1,
    });

    // token - {session: 'uuid'}
    const tokenPayload = {
      session: session.uuid,
    };

    const accessToken = makeToken({
      payload: tokenPayload,
      type: "accessToken",
    });
    const refreshToken = makeToken({
      payload: tokenPayload,
      type: "refreshToken",
    });

    // on client sid, set token in browsers cookies
    // this requires the frontend and backend to be on the same domain
    // for example,
    // http://foo.com - frontend
    // http://foo.com/api - backend
    res.setHeader("Set-Cookie", `x-refresh-token=${refreshToken}; HttpOnly`);
    return res.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserInfo = (req, res, next) => {
  try {
    const user = { ...res.locals.user };
    return res.json({ ...user });
  } catch (error) {
    next(error);
  }
};

export const makeNewTokens = async (req, res, next) => {
  // if a refresh token is sent, we return back a new access token and refresh token
  // and invalidate the old session
  try {
    const { body, cookies } = req.xop;
    // in browser the refresh token comes from cookies
    // in mobile apps and such we expect the request body to have it
    const refreshToken = body.refreshToken || cookies["x-refresh-token"];

    if (!refreshToken) {
      return next({
        status: 403,
        message: "Refresh token is not found.",
      });
    }

    // refresh token must not have been expired too!
    const { isExpired, decoded } = verifyJWT({
      token: refreshToken,
      tokenType: "refreshTokenPublicKey",
    });

    if (isExpired) {
      return next({
        status: 403,
        messageCode: "REFRESH_TOKEN_JWT_EXPIRED",
      });
    }

    if (!decoded) {
      return next({
        status: 403,
        messageCode: "REFRESH_TOKEN_JWT_INVALID",
      });
    }

    const sessionInfo = await db.Session.findOne({
      where: {
        uuid: decoded.session,
        isValid: true,
      },
      attributes: ["uuid", "user"],
      include: [
        {
          association: "User",
          attributes: ["uuid", "fullName", "email", "status"],
        },
      ],
    });

    if (!sessionInfo) {
      return next({
        status: 403,
        message: "Session has expired or is no longer valid",
      });
    }

    if (sessionInfo.User.status !== "active") {
      return next({
        status: 403,
        message: "Session is invalid as user is no longer active",
      });
    }

    // remove old sessions when a new refresh token is issued
    await db.Session.destroy({
      where: {
        user: sessionInfo.User.uuid,
      },
    });

    const newSession = await db.Session.create({
      user: sessionInfo.User.uuid,
      isValid: true,
    });

    // token - {session: 'uuid'}
    const tokenPayload = {
      session: newSession.uuid,
    };

    const newAccessToken = makeToken({
      payload: tokenPayload,
      type: "accessToken",
    });
    const newRefreshToken = makeToken({
      payload: tokenPayload,
      type: "refreshToken",
    });

    res.setHeader("Set-Cookie", `x-refresh-token=${newRefreshToken}; HttpOnly`);
    return res.send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const user = { ...res.locals.user };
    const { body } = req.xop;

    const userInfo = await db.User.findOne({
      where: {
        uuid: user.uuid,
      },
      attributes: ["uuid", "password"],
    });

    if (!(await userInfo.isValidPassword(body.oldPassword))) {
      return next({
        status: 400,
        message: "Current password is invalid",
      });
    }

    userInfo.password = body.newPassword;
    await userInfo.save();

    // all sessions need to be nuked, as the user
    // might be changing their password due to a concern
    await db.Session.destroy({
      where: {
        user: userInfo.uuid,
      },
    });

    return res.send({
      message: "New password has been set. Please login again",
      messageCode: "RE_LOGIN",
      user: {
        uuid: user.uuid,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const message =
      "If the email address exists in our system, it should be getting an email shortly.";
    const { body } = req.xop;
    const userPresent = await db.User.findOne({ where: { email: body.email } });

    if (!userPresent) {
      return next({
        status: 200,
        message,
      });
    }

    userPresent.generateReset();
    await userPresent.save();

    await sendForgotPasswordEmail({
      to: body.email,
      resetCode: userPresent.passwordResetCode,
      userId: userPresent.uuid,
    });

    return res.send({
      message,
      errors: [],
      messageCode: "",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { body } = req.xop;

    const userFound = await db.User.findOne({
      where: {
        uuid: body.userId,
      },
    });

    if (!userFound) {
      return next({
        status: 403,
        message: "User not found",
      });
    }

    // check if code has expired?
    if (!userFound.isResetCodeValid(body.resetCode)) {
      return next({
        status: 400,
        message: "Password reset token is invalid or has been expired.",
      });
    }

    userFound.password = body.password;
    userFound.clearReset();
    await userFound.save();

    return res.send({
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
