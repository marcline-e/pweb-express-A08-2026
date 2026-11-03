import type { Request, Response, NextFunction } from "express";

export function logger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
}
