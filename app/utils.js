import { v4 as uuidv4 } from "uuid";
import argon2 from "argon2";

export const getUuid = () => uuidv4();

export const getPasswordHash = ({ password }) => {
  return argon2.hash(password);
};
