import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import { Model } from "sequelize";

import logger from "../../logger.js";

const UserModel = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      passwordResetCode: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      passwordResetExpiry: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  User.addHook("beforeCreate", async (user) => {
    if (user.password) {
      const passwordHash = await argon2.hash(user.password);
      user.password = passwordHash;
    }
  });

  User.addHook("beforeUpdate", async (user) => {
    if (user.password) {
      const passwordHash = await argon2.hash(user.password);
      user.password = passwordHash;
    }
  });

  // instance methods have been removed in sequelize
  // this is the way!
  User.prototype.isValidPassword = function (password) {
    return argon2.verify(this.password, password);
  };

  User.prototype.generateReset = function () {
    let now = new Date();
    let hrs = 2; // 2 hours

    this.passwordResetCode = uuidv4();
    this.passwordResetExpiry = now.setTime(
      now.getTime() + hrs * 60 * 60 * 1000
    );

    return;
  };

  User.prototype.isResetCodeValid = function (inputResetCode) {
    let now = new Date();
    let code = this.passwordResetCode;
    let expiryDate = this.passwordResetExpiry;
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

  User.prototype.clearReset = function () {
    this.passwordResetCode = "";
    this.passwordResetExpiry = null;
    return;
  };

  return User;
};

export default UserModel;
