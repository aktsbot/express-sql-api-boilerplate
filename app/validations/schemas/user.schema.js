import joi from "joi";

export const updateUserInfoSchema = joi
  .object()
  .keys({
    body: joi.object().keys({
      email: joi.string().email(),
      fullName: joi.string(),
    }),
  })
  .unknown(true);
