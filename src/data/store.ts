// ─────────────────────────────────────────────────────────────
// In-Memory Data Store
// Simple mutable arrays with CRUD helpers. Seeded on import.
// Swap this for a real DB adapter later without touching logic.
// ─────────────────────────────────────────────────────────────

import type { TeamMember, Task, Project } from "../models/types.js";
import { seedProjects, seedTeamMembers, seedTasks } from "./seed.js";

// ── State ──

let teamMembers: TeamMember[] = [...seedTeamMembers];
let tasks: Task[] = [...seedTasks];
let projects: Project[] = [...seedProjects];

// ── Team Members ──

export function getAllTeamMembers(): TeamMember[] {
  return teamMembers;
}

export function getTeamMemberById(id: string): TeamMember | undefined {
  return teamMembers.find((m) => m.id === id);
}

export function createTeamMember(member: TeamMember): TeamMember {
  teamMembers.push(member);
  return member;
}

export function updateTeamMember(
  id: string,
  updates: Partial<Omit<TeamMember, "id">>
): TeamMember | undefined {
  const index = teamMembers.findIndex((m) => m.id === id);
  if (index === -1) return undefined;
  teamMembers[index] = { ...teamMembers[index], ...updates };
  return teamMembers[index];
}

export function deleteTeamMember(id: string): boolean {
  const len = teamMembers.length;
  teamMembers = teamMembers.filter((m) => m.id !== id);
  return teamMembers.length < len;
}

// ── Tasks ──

export function getAllTasks(): Task[] {
  return tasks;
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function getTasksByAssignee(assigneeId: string): Task[] {
  return tasks.filter((t) => t.assigneeId === assigneeId);
}

export function getTasksByProject(projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId);
}

export function getTasksByStatus(status: string): Task[] {
  return tasks.filter((t) => t.status === status);
}

export function getActiveTasks(): Task[] {
  return tasks.filter((t) => t.status !== "done");
}

export function getActiveTasksByAssignee(assigneeId: string): Task[] {
  return tasks.filter((t) => t.assigneeId === assigneeId && t.status !== "done");
}

export function createTask(task: Task): Task {
  tasks.push(task);
  return task;
}

export function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id">>
): Task | undefined {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return undefined;
  // Auto-update the updatedAt timestamp on any change
  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return tasks[index];
}

export function deleteTask(id: string): boolean {
  const len = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  return tasks.length < len;
}

// ── Projects ──

export function getAllProjects(): Project[] {
  return projects;
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function createProject(project: Project): Project {
  projects.push(project);
  return project;
}

export function updateProject(
  id: string,
  updates: Partial<Omit<Project, "id">>
): Project | undefined {
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  projects[index] = { ...projects[index], ...updates };
  return projects[index];
}

export function deleteProject(id: string): boolean {
  const len = projects.length;
  projects = projects.filter((p) => p.id !== id);
  return projects.length < len;
}

// ── Reset (useful for testing) ──

export function resetStore(): void {
  teamMembers = [...seedTeamMembers];
  tasks = [...seedTasks];
  projects = [...seedProjects];
}
