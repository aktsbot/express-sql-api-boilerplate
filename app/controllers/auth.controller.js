import logger from "../logger.js";

import { makeToken, verifyJWT } from "../jwt.js";
import { sendForgotPasswordEmail } from "../email.js";

// TODO:
// import User from "../models/user.model.js";
// import Session from "../models/session.model.js";
const Session = null;
const User = null;

export const signupUser = async (req, res, next) => {
  try {
    const { body } = req.xop;
    const userPresent = await User.findOne({ email: body.email }, { _id: 1 });

    if (userPresent) {
      return next({
        status: 409,
        message: `User with email ${body.email} already exists`,
      });
    }

    const user = await new User({ ...body }).save();

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
    const userPresent = await User.findOne(
      { email: body.email },
      { _id: 1, password: 1, email: 1, fullName: 1 }
    );

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

    const session = await new Session({
      user: userPresent._id,
      isValid: true,
    }).save();

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
    delete user._id;

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

    const sessionInfo = await Session.findOne({
      uuid: decoded.session,
      isValid: true,
    }).populate("user", "email fullName uuid _id");

    if (!sessionInfo) {
      return next({
        status: 403,
        message: "Session has expired or is no longer valid",
      });
    }

    sessionInfo.isValid = false;
    await sessionInfo.save();

    const session = await new Session({
      user: sessionInfo.user._id,
      isValid: true,
    }).save();

    // token - {session: 'uuid'}
    const tokenPayload = {
      session: session.uuid,
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

    const userInfo = await User.findById(user._id);

    if (!(await userInfo.isValidPassword(body.oldPassword))) {
      return next({
        status: 400,
        message: "Current password is invalid",
      });
    }

    userInfo.password = body.newPassword;
    await userInfo.save();

    await Session.deleteMany({ user: userInfo._id });

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
    const userPresent = await User.findOne({ email: body.email });

    if (!userPresent) {
      return next({
        status: 200,
        message,
      });
    }

    userPresent.generateReset();

    await userPresent.save();

    logger.debug(userPresent.uuid);
    logger.debug(userPresent.passwordReset.code);

    // TODO: send email
    await sendForgotPasswordEmail({
      to: body.email,
      resetCode: userPresent.passwordReset.code,
      userId: userPresent.uuid,
    });
    return res.send({
      message,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { body } = req.xop;

    const userFound = await User.findOne({
      uuid: body.userId,
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
