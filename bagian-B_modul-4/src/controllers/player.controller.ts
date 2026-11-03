import type { Request, Response, NextFunction } from "express";
import * as players from "../services/player.service";

const handle = (work: (req: Request) => Promise<unknown>, status = 200) => (req: Request, res: Response, next: NextFunction) => {
  work(req).then((data) => res.status(status).json({ success: true, data })).catch(next);
};

export const create = handle((req) => players.createPlayer(req.body), 201);
export const get = handle((req) => players.getPlayer(req.params.player_id));
export const update = handle((req) => players.updatePlayer(req.params.player_id, req.body));
export const remove = handle((req) => players.deletePlayer(req.params.player_id));
export const topup = handle((req) => players.topUp(req.params.player_id, req.body));
export const match = handle((req) => players.addMatchReward(req.params.player_id, req.body));
