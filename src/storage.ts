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
