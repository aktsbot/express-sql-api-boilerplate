import joi from "joi";

export const loginUserSchema = joi
  .object()
  .keys({
    body: joi.object().keys({
      email: joi.string().email().required(),
      password: joi.string().required(),
    }),
  })
  .unknown(true);

// the .unknown allows us to proceed if we dont have query or params
// defined in the schema
export const signupUserSchema = joi
  .object()
  .keys({
    body: joi.object().keys({
      email: joi.string().email().required(),
      password: joi.string().required(),
      fullName: joi.string().required(),
    }),
  })
  .unknown(true);

export const makeNewTokensSchema = joi
  .object()
  .keys({
    cookies: joi.object().keys({
      "x-refresh-token": joi.string(),
    }),
    body: joi.object().keys({
      refreshToken: joi.string(),
    }),
  })
  .unknown(true);

export const updatePasswordSchema = joi
  .object()
  .keys({
    body: joi.object().keys({
      oldPassword: joi.string().required(),
      newPassword: joi.string().required(),
    }),
  })
  .unknown(true);

export const forgotPasswordSchema = joi
  .object()
  .keys({
    body: joi.object().keys({
      email: joi.string().email().required(),
    }),
  })
  .unknown(true);

export const resetPasswordSchema = joi
  .object()
  .keys({
    body: joi.object().keys({
      userId: joi.string().guid().required(),
      resetCode: joi.string().guid().required(),
      password: joi.string().required(),
    }),
  })
  .unknown(true);
