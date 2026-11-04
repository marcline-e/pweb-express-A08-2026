import { Router } from "express";
import { skinController } from "../controllers/skin.controller";

const router = Router();

router.get("/", skinController.getAllSkins);
router.get("/:id", skinController.getSkinById);

export default router;