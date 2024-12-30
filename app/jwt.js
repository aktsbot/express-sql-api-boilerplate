import jwt from "jsonwebtoken";
import config from "./config.js";
import logger from "./logger.js";

export const makeJWT = ({ payload, tokenType, extraOptions }) => {
  let privateKeyName = "accessTokenPrivateKey";
  if (tokenType === "refreshToken") {
    privateKeyName = "refreshTokenPrivateKey";
  }
  const signingKey = Buffer.from(config[privateKeyName], "base64").toString(
    "ascii",
  );

  return jwt.sign(payload, signingKey, {
    ...(extraOptions && extraOptions),
    algorithm: "RS256",
  });
};

export const verifyJWT = ({ token, tokenType }) => {
  let publicKeyName = "accessTokenPublicKey";
  if (tokenType === "refreshToken") {
    publicKeyName = "refreshTokenPublicKey";
  }

  const publicKey = Buffer.from(config[publicKeyName], "base64").toString(
    "ascii",
  );

  try {
    const decoded = jwt.verify(token, publicKey);
    return { isExpired: false, decoded };
  } catch (e) {
    logger.debug(e);
    return {
      isExpired: e.message == "jwt expired",
      decoded: null,
    };
  }
};

export const makeToken = ({ payload, type }) => {
  let tokenType = "accessTokenPrivateKey";
  let expiresIn = "15m";
  if (type === "refreshToken") {
    tokenType = "refreshTokenPrivateKey";
    expiresIn = "30d";
  }
  return makeJWT({
    payload: { type, ...payload },
    tokenType,
    extraOptions: {
      expiresIn,
    },
  });
};
