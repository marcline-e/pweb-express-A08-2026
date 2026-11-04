import express, { ErrorRequestHandler } from "express";

import heroRoutes from "./routes/hero.routes";
import skinRoutes from "./routes/skin.routes";
import purchaseRoutes from "./routes/purchase.routes";
import statisticsRoutes from "./routes/statistics.routes";

const app = express();

// Middleware untuk membaca JSON
app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: true,
    message: "MLBB Shop API is running!",
  });
});

// API Routes
app.use("/api/heroes", heroRoutes);
app.use("/api/skins", skinRoutes);
app.use("/api/players", purchaseRoutes);
app.use("/api/statistics", statisticsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Endpoint tidak ditemukan",
    },
  });
});

// Global Error Handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
    },
  });
};

app.use(errorHandler);

export default app;