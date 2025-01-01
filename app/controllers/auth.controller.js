import logger from "../logger.js";

import { makeToken, verifyJWT } from "../jwt.js";
import { getUuid, isPasswordMatching, isResetValid } from "../utils.js";
import { sendForgotPasswordEmail } from "../email.js";

// TODO:
// import User from "../models/user.model.js";
// import Session from "../models/session.model.js";
// const Session = null;
// const User = null;
import User from "../db/user.js";
import Session from "../db/session.js";

export const signupUser = async (req, res, next) => {
  try {
    const { body } = req.xop;
    const userPresent = await User.findUserByEmail({ email: body.email });

    if (userPresent) {
      return next({
        status: 409,
        message: `User with email ${body.email} already exists`,
      });
    }

    // sqlite3 does not return inserted or updated rows
    // so we run two queries
    await User.createUser({ ...body });
    const user = await User.findUserByEmail({
      email: body.email,
      attributes: ["uuid", "email"],
    });

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
    const userPresent = await User.findUserByEmail({
      email: body.email,
      attributes: ["uuid", "password", "email", "full_name", "status"],
    });

    if (!userPresent) {
      return next({
        status: 401,
        message: errorMessage,
      });
    }

    const isPasswordValid = await isPasswordMatching({
      password: body.password,
      passwordHash: userPresent.password,
    });

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

    const sessionPayload = {
      user: userPresent.uuid,
      is_valid: 1,
      uuid: getUuid(),
    };
    Session.createSessionForUser({
      ...sessionPayload,
    });

    // token - {session: 'uuid'}
    const tokenPayload = {
      session: sessionPayload.uuid,
    };

    const accessToken = makeToken({
      payload: tokenPayload,
      type: "accessToken",
    });
    const refreshToken = makeToken({
      payload: tokenPayload,
      type: "refreshToken",
    });

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
    const { body } = req.xop;
    const refreshToken = body.refreshToken;

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

    const sessionInfo = await Session.findUserForValidSession({
      session_uuid: decoded.session,
    });

    if (!sessionInfo) {
      return next({
        status: 403,
        message:
          "Session has expired or is no longer valid or user is not active",
      });
    }

    // remove old sessions
    Session.deleteSessionsForUser({ user_uuid: sessionInfo.user_uuid });

    const sessionPayload = {
      user: sessionInfo.user_uuid,
      is_valid: 1,
      uuid: getUuid(),
    };
    Session.createSessionForUser({
      ...sessionPayload,
    });

    // token - {session: 'uuid'}
    const tokenPayload = {
      session: sessionPayload.uuid,
    };

    const newAccessToken = makeToken({
      payload: tokenPayload,
      type: "accessToken",
    });
    const newRefreshToken = makeToken({
      payload: tokenPayload,
      type: "refreshToken",
    });

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

    const userInfo = await User.findUserByUuid({
      uuid: user.uuid,
      attributes: ["uuid", "password"],
    });

    if (
      !(await isPasswordMatching({
        password: body.oldPassword,
        passwordHash: userInfo.password,
      }))
    ) {
      return next({
        status: 400,
        message: "Current password is invalid",
      });
    }

    await User.updateUserPassword({
      user_uuid: user.uuid,
      password: body.newPassword,
    });

    Session.deleteSessionsForUser({ user_uuid: user.uuid });

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
    const userPresent = await User.findUserByEmail({ email: body.email });

    if (!userPresent) {
      return next({
        status: 200,
        message,
      });
    }

    let now = new Date();
    let hrs = 2; // 2 hours

    const payload = {
      password_reset_code: getUuid(),
      password_reset_expiry: now.setTime(now.getTime() + hrs * 60 * 60 * 1000),
    };

    User.setResetForUser({ user_uuid: userPresent.uuid, payload });

    logger.debug(userPresent.uuid);

    await sendForgotPasswordEmail({
      to: body.email,
      resetCode: payload.password_reset_code,
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

    const userFound = await User.findUserByUuid({
      uuid: body.userId,
      attributes: ["uuid", "password_reset_code", "password_reset_expiry"],
    });

    if (!userFound) {
      return next({
        status: 403,
        message: "User not found",
      });
    }

    // check if code has expired?
    if (
      !isResetValid({
        password_reset_code: userFound.password_reset_code,
        password_reset_expiry: userFound.password_reset_expiry,
        input_code: body.resetCode,
      })
    ) {
      return next({
        status: 400,
        message: "Password reset token is invalid or has been expired.",
      });
    }

    User.updateUserPassword({
      user_uuid: userFound.uuid,
      password: body.password,
    });
    User.setResetForUser({
      user_uuid: userFound.uuid,
      payload: {
        password_reset_code: "",
        password_reset_expiry: "",
      },
    });

    return res.send({
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
