import { Router } from "express";

import authRouter from "./auth.route.js";
import userRouter from "./user.route.js";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/users", userRouter);

export default appRouter;
