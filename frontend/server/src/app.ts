import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import quizRoutes from "./routes/quizzes.js";
import plannerRoutes from "./routes/planner.js";
import analyticsRoutes from "./routes/analytics.js";
import subjectRoutes from "./routes/subjects.js";
import notesRoutes from "./routes/notes.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import chatRoutes from "./routes/chat.js";

function buildAllowedOrigins(): string[] {
  const origins = new Set<string>([
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_BRANCH_URL) {
    origins.add(process.env.VERCEL_BRANCH_URL);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  return [...origins];
}

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = buildAllowedOrigins();
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "learniq-api",
    version: "1.0.0",
    runtime: process.env.VERCEL ? "vercel" : "node",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
