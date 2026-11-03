import type { Request, Response } from "express";
import * as purchaseService from "../services/purchase.service";

// Error dari service otomatis diteruskan Express 5 ke errorHandler (async handler)
export async function buyHero(req: Request<{ player_id: string }>, res: Response) {
  const data = await purchaseService.buyHero(req.params.player_id, req.body);
  res.status(201).json({ status: true, message: "Hero berhasil dibeli", data });
}
