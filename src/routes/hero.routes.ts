import { Router } from "express";
import { heroController } from "../controllers/hero.controller";

const router = Router();

router.get("/", heroController.getAllHeroes);
router.get("/:id", heroController.getHeroById);
router.post("/", heroController.createHero);

export default router;