import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import skillsRouter from "./skills";
import coursesRouter from "./courses";
import jobsRouter from "./jobs";
import badgesRouter from "./badges";
import careerRouter from "./career";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(skillsRouter);
router.use(coursesRouter);
router.use(jobsRouter);
router.use(badgesRouter);
router.use(careerRouter);
router.use(chatRouter);

export default router;
