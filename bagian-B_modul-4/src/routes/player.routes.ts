import { Router } from "express";
import * as controller from "../controllers/player.controller";

const router = Router();
router.post("/", controller.create);
router.get("/:player_id", controller.get);
router.patch("/:player_id", controller.update);
router.delete("/:player_id", controller.remove);
router.post("/:player_id/topup", controller.topup);
router.post("/:player_id/matches", controller.match);
export default router;
