import { verifyJWT } from "../jwt.js";
import logger from "../logger.js";

import db from "../db/index.js";

export const deserializeUser = (req, res, next) => {
  const accessToken = (req.headers.authorization || "").replace(
    /^Bearer\s/,
    ""
  );

  if (!accessToken) {
    return next();
  }

  const { isExpired, decoded } = verifyJWT({
    token: accessToken,
    tokenType: "accessTokenPublicKey",
  });

  if (decoded) {
    res.locals.session = decoded;
  }

  res.locals.accessTokenExpired = isExpired;

  return next();
};

export const requireUser = async (req, res, next) => {
  if (res.locals.accessTokenExpired) {
    return next({
      status: 403,
      message: "Login required for accessing resource",
      messageCode: "ACCESS_TOKEN_JWT_EXPIRED",
    });
  }

  const session = res.locals.session;

  if (!session) {
    return next({
      status: 403,
      message: "Login required for accessing resource",
    });
  }

  try {
    const sessionInfo = await db.Session.findOne({
      where: {
        uuid: session.session,
      },
      include: {
        association: "User",
        attributes: ["uuid", "fullName", "email"],
      },
    });

    if (!sessionInfo) {
      return next({
        status: 403,
        message:
          "Session has expired or is no longer valid or user might not be active",
      });
    }

    res.locals.user = {
      uuid: sessionInfo.User.uuid,
      full_name: sessionInfo.User.fullName,
      email: sessionInfo.User.email,
    };

    return next();
  } catch (error) {
    next(error);
  }
};
