import { v4 as uuidv4 } from "uuid";
import argon2 from "argon2";

export const getUuid = () => uuidv4();

export const getPasswordHash = ({ password }) => {
  return argon2.hash(password);
};

export const isPasswordMatching = ({ password, passwordHash }) => {
  return argon2.verify(passwordHash, password);
};

export const isResetValid = ({
  password_reset_code,
  password_reset_expiry,
  input_code,
}) => {
  let now = new Date();
  let code = password_reset_code;
  let expiryDate = password_reset_expiry;
  if (!expiryDate || !code) {
    logger.debug("date or code not found");
    return false;
  }

  if (password_reset_code !== input_code) {
    logger.debug("code does not match");
    logger.debug(`code ${password_reset_code}`);
    logger.debug(`inputResetCode ${input_code}`);
    return false;
  }

  expiryDate = new Date(expiryDate);

  if (now > expiryDate) {
    logger.debug("date expired");
    return false;
  }

  return true;
};
