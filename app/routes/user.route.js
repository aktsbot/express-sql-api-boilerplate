import { Router } from "express";

import { validate } from "../middlewares/validate.middleware.js";
import { requireUser } from "../middlewares/auth.middleware.js";

import { updateUserInfo } from "../controllers/user.controller.js";

import { updateUserInfoSchema } from "../validations/schemas/user.schema.js";

const router = Router();

router.patch("/", requireUser, validate(updateUserInfoSchema), updateUserInfo);

export default router;
