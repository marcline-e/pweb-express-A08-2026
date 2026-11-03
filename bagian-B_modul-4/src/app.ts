import express from "express";
import playerRoutes from "./routes/player.routes";
import { logger } from "./middlewares/logger";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(express.json());
app.use(logger);
app.use("/api/players", playerRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
