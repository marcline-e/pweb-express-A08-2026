import type { Request, Response } from "express";
import * as statisticsService from "../services/statistics.service";

// Error dari service otomatis diteruskan Express 5 ke errorHandler (async handler)
export async function getStatistics(_req: Request, res: Response) {
  const data = await statisticsService.getStatistics();
  res.json({ status: true, message: "Berhasil mengambil statistik", data });
}
