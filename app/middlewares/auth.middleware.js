import { verifyJWT } from "../jwt.js";
import logger from "../logger.js";
// TODO:
// import Session from "../models/session.model.js";
const Session = null;

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
  logger.debug(res.locals);

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
    const sessionInfo = await Session.findOne({
      uuid: session.session,
      isValid: true,
    })
      .populate("user", "email fullName uuid")
      .lean();

    if (!sessionInfo) {
      return next({
        status: 403,
        message: "Session has expired or is no longer valid",
      });
    }

    res.locals.user = sessionInfo.user;

    return next();
  } catch (error) {
    next(error);
  }
};
