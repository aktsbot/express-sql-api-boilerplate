import { Model } from "sequelize";

const SessionModel = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      // define association here
    }
  }
  Session.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user: {
        type: DataTypes.UUID,
        references: {
          model: "Users", // table name
          key: "uuid",
        },
      },
      isValid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Session",
    }
  );
  return Session;
};

export default SessionModel;
