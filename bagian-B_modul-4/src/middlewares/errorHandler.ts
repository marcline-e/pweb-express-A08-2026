import type { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/HttpError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ success: false, error: { message: error.message } });
    return;
  }
  if (error?.code === "P2002") {
    res.status(409).json({ success: false, error: { message: "Data sudah digunakan" } });
    return;
  }
  console.error(error);
  res.status(500).json({ success: false, error: { message: "Terjadi kesalahan pada server" } });
};
