import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
import { formatDate } from "../dateUtils";
import type { ScheduledTask } from "../types";

interface Props {
  tasks: ScheduledTask[];
  viewMode: "Day" | "Week" | "Month";
  onDateChange: (taskId: string, start: string, end: string) => void;
  onProgressChange: (taskId: string, progress: number) => void;
}

export function GanttChart({ tasks, viewMode, onDateChange, onProgressChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const frappeTasks = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.computedStart,
      end: t.computedEnd,
      progress: t.progress,
      dependencies: t.dependencies.join(", "),
      custom_class: `section-${t.section.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
    }));

    if (!ganttRef.current) {
      ganttRef.current = new Gantt(containerRef.current, frappeTasks, {
        view_mode: viewMode,
        bar_height: 28,
        padding: 20,
        on_date_change: (task, start, end) => {
          onDateChange(task.id, formatDate(start), formatDate(end));
        },
        on_progress_change: (task, progress) => {
          onProgressChange(task.id, progress);
        },
      });
    } else {
      ganttRef.current.refresh(frappeTasks);
      ganttRef.current.change_view_mode(viewMode);
    }
  }, [tasks, viewMode, onDateChange, onProgressChange]);

  return <div ref={containerRef} className="gantt-container" />;
}
