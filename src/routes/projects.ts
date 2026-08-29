// ─────────────────────────────────────────────────────────────
// Projects CRUD Routes
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import type { Project, Priority } from "../models/types.js";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../data/store.js";

const router = Router();

/** GET /api/projects — List all projects */
router.get("/", (_req, res) => {
  res.json(getAllProjects());
});

/** GET /api/projects/:id — Get a single project */
router.get("/:id", (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) {
    res.status(404).json({ error: `Project ${req.params.id} not found` });
    return;
  }
  res.json(project);
});

/** POST /api/projects — Create a new project */
router.post("/", (req, res) => {
  const body = req.body as Partial<Project>;

  if (!body.name || !body.priority || !body.deadline) {
    res.status(400).json({
      error: "Missing required fields: name, priority, deadline",
    });
    return;
  }

  const project: Project = {
    id: body.id ?? `proj_${uuidv4().slice(0, 8)}`,
    name: body.name,
    priority: body.priority as Priority,
    deadline: body.deadline,
    owner: body.owner ?? "",
  };

  createProject(project);
  res.status(201).json(project);
});

/** PUT /api/projects/:id — Update a project */
router.put("/:id", (req, res) => {
  const updated = updateProject(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: `Project ${req.params.id} not found` });
    return;
  }
  res.json(updated);
});

/** DELETE /api/projects/:id — Delete a project */
router.delete("/:id", (req, res) => {
  const deleted = deleteProject(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: `Project ${req.params.id} not found` });
    return;
  }
  res.status(204).send();
});

export default router;
