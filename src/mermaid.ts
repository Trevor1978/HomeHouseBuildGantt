import type { GanttProject, GanttTask } from "./types";

function parseTaskLine(line: string, section: string): GanttTask | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("section ") || trimmed.startsWith("gantt")) {
    return null;
  }

  const colonIdx = trimmed.lastIndexOf(":");
  if (colonIdx === -1) return null;

  const name = trimmed.slice(0, colonIdx).trim();
  const meta = trimmed.slice(colonIdx + 1).trim();
  const parts = meta.split(",").map((p) => p.trim());

  if (parts.length < 2) return null;

  const id = parts[0];
  const schedule = parts[1];
  const durationPart = parts[2] ?? "1d";
  const durationDays = parseInt(durationPart.replace(/d$/i, ""), 10) || 1;

  let startDate: string | undefined;
  const dependencies: string[] = [];

  if (/^\d{4}-\d{2}-\d{2}$/.test(schedule)) {
    startDate = schedule;
  } else if (schedule.toLowerCase().startsWith("after ")) {
    const dep = schedule.slice(6).trim();
    if (dep) dependencies.push(dep);
  }

  return {
    id,
    name,
    section,
    startDate,
    durationDays,
    dependencies,
    progress: 0,
  };
}

export function parseMermaid(source: string): GanttProject {
  const lines = source.split("\n");
  let title = "Gantt Chart";
  let dateFormat = "YYYY-MM-DD";
  let axisFormat = "Week %W";
  let currentSection = "General";
  const sections: string[] = [];
  const tasks: GanttTask[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("title ")) {
      title = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("dateFormat")) {
      dateFormat = line.replace(/dateFormat\s*/i, "").trim();
      continue;
    }
    if (line.startsWith("axisFormat")) {
      axisFormat = line.replace(/axisFormat\s*/i, "").trim();
      continue;
    }
    if (line.startsWith("section ")) {
      currentSection = line.slice(8).trim();
      if (!sections.includes(currentSection)) sections.push(currentSection);
      continue;
    }

    const task = parseTaskLine(line, currentSection);
    if (task) {
      if (!sections.includes(task.section)) sections.push(task.section);
      tasks.push(task);
    }
  }

  return { title, dateFormat, axisFormat, sections, tasks };
}

export function toMermaid(project: GanttProject): string {
  const lines: string[] = [
    "gantt",
    `    title ${project.title}`,
    `    dateFormat  ${project.dateFormat}`,
    `    axisFormat  ${project.axisFormat}`,
    "",
  ];

  const sectionOrder =
    project.sections.length > 0
      ? project.sections
      : [...new Set(project.tasks.map((t) => t.section))];

  for (const section of sectionOrder) {
    const sectionTasks = project.tasks.filter((t) => t.section === section);
    if (sectionTasks.length === 0) continue;

    lines.push(`    section ${section}`);
    for (const task of sectionTasks) {
      const name = task.name.padEnd(30, " ");
      let schedule: string;
      if (task.startDate) {
        schedule = `${task.startDate}, ${task.durationDays}d`;
      } else if (task.dependencies.length > 0) {
        schedule = `after ${task.dependencies[0]}, ${task.durationDays}d`;
      } else {
        schedule = `2026-01-01, ${task.durationDays}d`;
      }
      lines.push(`    ${name} :${task.id}, ${schedule}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
