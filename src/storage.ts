import type { GanttProject } from "./types";

const STORAGE_KEY = "house-build-gantt-v1";

export function loadProject(fallback: GanttProject): GanttProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as GanttProject;
  } catch {
    return fallback;
  }
}

export function saveProject(project: GanttProject): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}
