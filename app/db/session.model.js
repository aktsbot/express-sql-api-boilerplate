import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const SessionSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      default: () => uuidv4(),
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("Session", SessionSchema);
