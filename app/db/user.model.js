import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import argon2 from "argon2";

import logger from "../logger.js";

const UserSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      default: () => uuidv4(),
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "active", // active, inactive
    },
    passwordReset: {
      code: String,
      expiry: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const passwordHash = await argon2.hash(this.password);
  this.password = passwordHash;
  return;
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await argon2.verify(this.password, password);
  } catch (error) {
    logger.error("Could not validate password");
    return false;
  }
};

UserSchema.methods.generateReset = function () {
  let now = new Date();
  let hrs = 2; // 2 hours
  this.passwordReset = {
    code: uuidv4(),
    expiry: now.setTime(now.getTime() + hrs * 60 * 60 * 1000),
  };
  return;
};

UserSchema.methods.isResetCodeValid = function (inputResetCode) {
  let now = new Date();
  let code = this.passwordReset.code;
  let expiryDate = this.passwordReset.expiry;
  if (!expiryDate || !code) {
    logger.debug("date or code not found");
    return false;
  }

  if (code !== inputResetCode) {
    logger.debug("code does not match");
    logger.debug(`code ${code}`);
    logger.debug(`inputResetCode ${inputResetCode}`);
    return false;
  }

  expiryDate = new Date(expiryDate);

  if (now > expiryDate) {
    logger.debug("date expired");
    return false;
  }

  return true;
};

UserSchema.methods.clearReset = function () {
  this.passwordReset = {
    code: "",
    expiry: null,
  };
  return;
};

export default mongoose.model("User", UserSchema);
