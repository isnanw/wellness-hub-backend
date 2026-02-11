import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { serveStatic } from "hono/bun";
import "dotenv/config";

import { usersRouter } from "./routes/users";
import { servicesRouter } from "./routes/services";
import { newsRouter } from "./routes/news";
import { programsRouter } from "./routes/programs";
import { registrationsRouter } from "./routes/registrations";
import { schedulesRouter } from "./routes/schedules";
import { uploadRouter } from "./routes/upload";
import { documentsRouter } from "./routes/documents";
import { healthReportsRouter } from "./routes/health-reports";
import puskesmasRouter from "./routes/puskesmas";
import statsRouter from "./routes/stats";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    message: "Wellness Hub API",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Serve static files from uploads folder
app.use("/uploads/*", serveStatic({ root: "./" }));

// Routes
app.route("/api/users", usersRouter);
app.route("/api/services", servicesRouter);
app.route("/api/news", newsRouter);
app.route("/api/programs", programsRouter);
app.route("/api/registrations", registrationsRouter);
app.route("/api/schedules", schedulesRouter);
app.route("/api/upload", uploadRouter);
app.route("/api/documents", documentsRouter);
app.route("/api/health", healthReportsRouter);
app.route("/api/puskesmas", puskesmasRouter);
app.route("/api/stats", statsRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err}`);
  return c.json({ error: "Internal Server Error" }, 500);
});

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Server is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
