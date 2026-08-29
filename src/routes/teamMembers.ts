// ─────────────────────────────────────────────────────────────
// Team Members CRUD Routes
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import type { TeamMember } from "../models/types.js";
import {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../data/store.js";

const router = Router();

/** GET /api/team-members — List all team members */
router.get("/", (_req, res) => {
  res.json(getAllTeamMembers());
});

/** GET /api/team-members/:id — Get a single team member */
router.get("/:id", (req, res) => {
  const member = getTeamMemberById(req.params.id);
  if (!member) {
    res.status(404).json({ error: `Team member ${req.params.id} not found` });
    return;
  }
  res.json(member);
});

/** POST /api/team-members — Create a new team member */
router.post("/", (req, res) => {
  const body = req.body as Partial<TeamMember>;

  if (!body.name || !body.role || !body.weeklyCapacityHours) {
    res.status(400).json({
      error: "Missing required fields: name, role, weeklyCapacityHours",
    });
    return;
  }

  const member: TeamMember = {
    id: body.id ?? `tm_${uuidv4().slice(0, 8)}`,
    name: body.name,
    role: body.role,
    weeklyCapacityHours: body.weeklyCapacityHours,
    skills: body.skills ?? [],
    timeOff: body.timeOff ?? [],
  };

  createTeamMember(member);
  res.status(201).json(member);
});

/** PUT /api/team-members/:id — Update a team member */
router.put("/:id", (req, res) => {
  const updated = updateTeamMember(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: `Team member ${req.params.id} not found` });
    return;
  }
  res.json(updated);
});

/** DELETE /api/team-members/:id — Delete a team member */
router.delete("/:id", (req, res) => {
  const deleted = deleteTeamMember(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: `Team member ${req.params.id} not found` });
    return;
  }
  res.status(204).send();
});

export default router;
