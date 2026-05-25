import { addDays, formatDate, maxDate, parseDate } from "./dateUtils";
import type { GanttProject, GanttTask, ScheduledTask } from "./types";

export function computeSchedule(project: GanttProject): ScheduledTask[] {
  const byId = new Map(project.tasks.map((t) => [t.id, t]));
  const startById = new Map<string, string>();
  const visiting = new Set<string>();

  const resolveStart = (task: GanttTask): string => {
    if (startById.has(task.id)) {
      return startById.get(task.id)!;
    }
    if (visiting.has(task.id)) {
      throw new Error(`Circular dependency detected at task "${task.id}"`);
    }
    visiting.add(task.id);

    let start: string;
    if (task.startDate) {
      start = task.startDate;
    } else if (task.dependencies.length === 0) {
      const anchor = project.tasks.find((t) => t.startDate)?.startDate ?? formatDate(new Date());
      start = anchor;
    } else {
      const depEnds = task.dependencies.map((depId) => {
        const dep = byId.get(depId);
        if (!dep) throw new Error(`Unknown dependency "${depId}" for task "${task.id}"`);
        const depStart = resolveStart(dep);
        return addDays(depStart, dep.durationDays);
      });
      start = maxDate(...depEnds);
    }

    visiting.delete(task.id);
    startById.set(task.id, start);
    return start;
  };

  return project.tasks.map((task) => {
    const computedStart = resolveStart(task);
    const computedEnd = addDays(computedStart, task.durationDays);
    return { ...task, computedStart, computedEnd };
  });
}

export function applyDragDates(
  project: GanttProject,
  taskId: string,
  newStart: string,
  newEnd: string
): GanttProject {
  const durationDays = Math.max(
    1,
    Math.round((parseDate(newEnd).getTime() - parseDate(newStart).getTime()) / (24 * 60 * 60 * 1000))
  );

  const tasks = project.tasks.map((t) => {
    if (t.id !== taskId) return t;
    return {
      ...t,
      startDate: newStart,
      durationDays,
      dependencies: [],
    };
  });

  return { ...project, tasks };
}
