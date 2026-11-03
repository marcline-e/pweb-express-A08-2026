import { Router } from "express";
import { getStatistics } from "../controllers/statistics.controller";

const router = Router();

router.get("/", getStatistics);

export default router;
