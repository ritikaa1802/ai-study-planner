import "dotenv/config";
import aiRoutes from "./routes/ai";
import adminRoutes from "./routes/admin.routes";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import goalRoutes from "./routes/goal.routes";
import resourceRoutes from "./routes/resource.routes";
import studyCircleRoutes from "./routes/studyCircle.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import userRoutes from "./routes/user.routes";
import activityRoutes from "./routes/activity.routes";
import calendarRoutes from "./routes/calendar.routes";
import sessionRoutes from "./routes/session.routes";
import noteRoutes from "./routes/note.routes";
import path from "path";

import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(express.json());
app.use(
  helmet({
    // Frontend runs on a different origin in dev, so uploaded images must be loadable cross-origin.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const previewDomainRegex = /^https:\/\/[a-zA-Z0-9-]+(?:-[a-zA-Z0-9-]+)*\.vercel\.app$/;
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients/tools and same-origin calls without origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (allowVercelPreviews && previewDomainRegex.test(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many requests. Please try again later." });
  },
});

app.use(limiter);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is live" });
});

app.use("/api", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/study-circles", studyCircleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notes", noteRoutes);

app.use(errorHandler);

export default app;
