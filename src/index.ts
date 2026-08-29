// ─────────────────────────────────────────────────────────────
// Server Entry Point
// Express app with CORS, JSON parsing, all routes mounted.
// Seed data loaded automatically on import of the store module.
// ─────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";

import analysisRoutes from "./routes/analysis.js";
import teamMemberRoutes from "./routes/teamMembers.js";
import taskRoutes from "./routes/tasks.js";
import projectRoutes from "./routes/projects.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── API Routes ──
app.use("/api/analysis", analysisRoutes);
app.use("/api/team-members", teamMemberRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Static Frontend Files ──
// Serves compiled React app from client/dist if built
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const clientDistLocal = path.resolve(__dirname, "../client/dist");
const activeDistPath = path.resolve(__dirname, "../client/dist");

app.use(express.static(clientDistLocal));
app.use(express.static(clientDistPath));

// Fallback to client/dist/index.html for client-side routing
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(clientDistLocal, "index.html"), (err) => {
    if (err) {
      res.sendFile(path.join(clientDistPath, "index.html"), (err2) => {
        if (err2) next();
      });
    }
  });
});

// ── Notification placeholder ──
// Hook for future Slack/email integrations.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendNotification(
  channel: string,
  message: string
): Promise<void> {
  console.log(`[NOTIFICATION STUB] → ${channel}: ${message}`);
  // Replace with real Slack/email integration in v2
}

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🚀 Workload Agent API running on http://localhost:${PORT}`);
  console.log(`\n  Endpoints:`);
  console.log(`    GET  /api/health          — Health check`);
  console.log(`    GET  /api/analysis         — Run full workload analysis`);
  console.log(`    GET  /api/analysis?date=YYYY-MM-DD — Analysis with custom date`);
  console.log(`    CRUD /api/team-members     — Team member management`);
  console.log(`    CRUD /api/tasks            — Task management`);
  console.log(`    CRUD /api/projects         — Project management`);
  console.log(`\n  Seed data loaded: 6 team members, 16 tasks, 3 projects\n`);
});

export default app;
