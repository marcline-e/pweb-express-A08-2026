
import { Request, Response, NextFunction } from "express";
import { heroService } from "../services/hero.service";

export const heroController = {
  // GET /api/heroes
  async getAllHeroes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await heroService.getAllHeroes({
        role: req.query.role as string,
        search: req.query.search as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });

      res.status(200).json({
        success: true,
        data: result.heroes,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/heroes/:id
  async getHeroById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const hero = await heroService.getHeroById(id);

      res.status(200).json({
        success: true,
        data: hero,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/heroes
  async createHero(req: Request, res: Response, next: NextFunction) {
    try {
      const newHero = await heroService.createHero(req.body);

      res.status(201).json({
        success: true,
        data: newHero,
      });
    } catch (error) {
      next(error);
    }
  },
};
