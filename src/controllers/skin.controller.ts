
import { Request, Response, NextFunction } from "express";
import { skinService } from "../services/skin.service";

export const skinController = {
  // GET /api/skins
  async getAllSkins(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await skinService.getAllSkins({
        heroId: req.query.heroId as string,
        rarity: req.query.rarity as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });

      res.status(200).json({
        success: true,
        data: result.skins,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/skins/:id
  async getSkinById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const skin = await skinService.getSkinById(id);

      res.status(200).json({
        success: true,
        data: skin,
      });
    } catch (error) {
      next(error);
    }
  },
};
