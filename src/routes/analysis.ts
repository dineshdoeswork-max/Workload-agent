// ─────────────────────────────────────────────────────────────
// Analysis Routes
// GET /api/analysis — runs the full workload analysis
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { analyzeWorkload } from "../logic/analyzeWorkload.js";

const router = Router();

/**
 * GET /api/analysis
 * Runs the full workload analysis and returns the complete AnalysisResult.
 * Accepts an optional `date` query param (ISO date) to override "today"
 * for testing/demo purposes.
 */
router.get("/", (_req, res) => {
  try {
    const dateParam = _req.query.date as string | undefined;
    const referenceDate = dateParam ? new Date(dateParam) : undefined;

    const result = analyzeWorkload(referenceDate);
    res.json(result);
  } catch (error) {
    console.error("Analysis failed:", error);
    res.status(500).json({
      error: "Analysis failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
