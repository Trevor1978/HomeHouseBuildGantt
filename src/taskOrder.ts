import type { GanttTask } from "./types";

export type InsertPosition = "start" | "end" | string;

function sectionIndices(tasks: GanttTask[], section: string): number[] {
  const indices: number[] = [];
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].section === section) indices.push(i);
  }
  return indices;
}

export function moveTaskInList(
  tasks: GanttTask[],
  taskId: string,
  direction: "up" | "down"
): GanttTask[] {
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index < 0) return tasks;

  const section = tasks[index].section;
  const indices = sectionIndices(tasks, section);
  const pos = indices.indexOf(index);
  if (pos < 0) return tasks;

  const targetPos = direction === "up" ? pos - 1 : pos + 1;
  if (targetPos < 0 || targetPos >= indices.length) return tasks;

  const a = indices[pos];
  const b = indices[targetPos];
  const next = [...tasks];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export function insertTaskAt(
  tasks: GanttTask[],
  task: GanttTask,
  position: InsertPosition
): GanttTask[] {
  const indices = sectionIndices(tasks, task.section);
  let insertAt: number;

  if (position === "start") {
    insertAt = indices.length > 0 ? indices[0] : tasks.length;
  } else if (position === "end" || !position) {
    insertAt = indices.length > 0 ? indices[indices.length - 1] + 1 : tasks.length;
  } else {
    const afterIndex = tasks.findIndex((t) => t.id === position);
    if (afterIndex < 0) {
      insertAt = indices.length > 0 ? indices[indices.length - 1] + 1 : tasks.length;
    } else {
      insertAt = afterIndex + 1;
    }
  }

  const next = [...tasks];
  next.splice(insertAt, 0, task);
  return next;
}

export function canMoveTask(
  tasks: GanttTask[],
  taskId: string,
  direction: "up" | "down"
): boolean {
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index < 0) return false;
  const indices = sectionIndices(tasks, tasks[index].section);
  const pos = indices.indexOf(index);
  if (pos < 0) return false;
  return direction === "up" ? pos > 0 : pos < indices.length - 1;
}

/** Rebuild task list so rows follow section order (used after section reorder). */
export function reorderTasksBySections(tasks: GanttTask[], sections: string[]): GanttTask[] {
  const order =
    sections.length > 0 ? sections : [...new Set(tasks.map((t) => t.section))];
  const result: GanttTask[] = [];
  const seen = new Set<string>();

  for (const section of order) {
    for (const t of tasks) {
      if (t.section === section) result.push(t);
    }
    seen.add(section);
  }

  for (const t of tasks) {
    if (!seen.has(t.section)) result.push(t);
  }

  return result;
}

export function canMoveSection(
  sections: string[],
  section: string,
  direction: "up" | "down"
): boolean {
  const idx = sections.indexOf(section);
  if (idx < 0) return false;
  return direction === "up" ? idx > 0 : idx < sections.length - 1;
}

export function moveSectionInList(
  sections: string[],
  tasks: GanttTask[],
  section: string,
  direction: "up" | "down"
): { sections: string[]; tasks: GanttTask[] } | null {
  const idx = sections.indexOf(section);
  if (idx < 0) return null;

  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= sections.length) return null;

  const nextSections = [...sections];
  [nextSections[idx], nextSections[target]] = [nextSections[target], nextSections[idx]];

  return {
    sections: nextSections,
    tasks: reorderTasksBySections(tasks, nextSections),
  };
}
