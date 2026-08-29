// ─────────────────────────────────────────────────────────────
// Tasks CRUD Routes
// Supports filtering by assigneeId, projectId, and status
// via query params on the list endpoint.
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import type { Task, Priority, TaskStatus } from "../models/types.js";
import {
  getAllTasks,
  getTaskById,
  getTasksByAssignee,
  getTasksByProject,
  getTasksByStatus,
  createTask,
  updateTask,
  deleteTask,
} from "../data/store.js";

const router = Router();

/** GET /api/tasks — List all tasks, with optional filters */
router.get("/", (req, res) => {
  const { assigneeId, projectId, status } = req.query;

  let tasks = getAllTasks();

  if (assigneeId && typeof assigneeId === "string") {
    tasks = tasks.filter((t) => t.assigneeId === assigneeId);
  }
  if (projectId && typeof projectId === "string") {
    tasks = tasks.filter((t) => t.projectId === projectId);
  }
  if (status && typeof status === "string") {
    tasks = tasks.filter((t) => t.status === status);
  }

  res.json(tasks);
});

/** GET /api/tasks/:id — Get a single task */
router.get("/:id", (req, res) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: `Task ${req.params.id} not found` });
    return;
  }
  res.json(task);
});

/** POST /api/tasks — Create a new task */
router.post("/", (req, res) => {
  const body = req.body as Partial<Task>;

  if (
    !body.title ||
    !body.assigneeId ||
    !body.projectId ||
    body.estimatedEffort === undefined ||
    !body.priority ||
    !body.status ||
    !body.deadline
  ) {
    res.status(400).json({
      error:
        "Missing required fields: title, assigneeId, projectId, estimatedEffort, priority, status, deadline",
    });
    return;
  }

  const now = new Date().toISOString();
  const task: Task = {
    id: body.id ?? `t_${uuidv4().slice(0, 8)}`,
    title: body.title,
    description: body.description ?? "",
    assigneeId: body.assigneeId,
    projectId: body.projectId,
    estimatedEffort: body.estimatedEffort,
    priority: body.priority as Priority,
    status: body.status as TaskStatus,
    deadline: body.deadline,
    dependencies: body.dependencies ?? [],
    createdAt: now,
    updatedAt: now,
  };

  createTask(task);
  res.status(201).json(task);
});

/** PUT /api/tasks/:id — Update a task (auto-sets updatedAt) */
router.put("/:id", (req, res) => {
  const updated = updateTask(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: `Task ${req.params.id} not found` });
    return;
  }
  res.json(updated);
});

/** DELETE /api/tasks/:id — Delete a task */
router.delete("/:id", (req, res) => {
  const deleted = deleteTask(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: `Task ${req.params.id} not found` });
    return;
  }
  res.status(204).send();
});

export default router;
