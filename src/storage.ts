import type { GanttProject, GanttTask } from "./types";

const STORAGE_KEY = "house-build-gantt-v1";

function normalizeTask(task: GanttTask): GanttTask {
  return {
    ...task,
    lagDays: Math.max(0, task.lagDays ?? 0),
  };
}

function normalizeProject(project: GanttProject): GanttProject {
  return {
    ...project,
    tasks: project.tasks.map(normalizeTask),
  };
}

export function loadProject(fallback: GanttProject): GanttProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return normalizeProject(JSON.parse(raw) as GanttProject);
  } catch {
    return fallback;
  }
}

export function saveProject(project: GanttProject): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

export async function loadServerProject(): Promise<GanttProject | null> {
  try {
    const response = await fetch("/api/project", { cache: "no-store" });
    if (response.status === 204) return null;
    if (!response.ok) return null;
    const parsed = (await response.json()) as GanttProject;
    return normalizeProject(parsed);
  } catch {
    return null;
  }
}

export async function saveServerProject(project: GanttProject): Promise<void> {
  try {
    await fetch("/api/project", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
  } catch {
    // Keep local storage as the fallback if the server is unavailable.
  }
}
