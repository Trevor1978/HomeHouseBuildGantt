import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
import { formatDate } from "../dateUtils";
import type { ScheduledTask } from "../types";

interface Props {
  tasks: ScheduledTask[];
  viewMode: "Day" | "Week" | "Month";
  onDateChange: (taskId: string, start: string, end: string) => void;
  onProgressChange: (taskId: string, progress: number) => void;
  onTaskClick?: (taskId: string) => void;
}

export function GanttChart({
  tasks,
  viewMode,
  onDateChange,
  onProgressChange,
  onTaskClick,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);
  const onDateChangeRef = useRef(onDateChange);
  const onProgressChangeRef = useRef(onProgressChange);
  const onTaskClickRef = useRef(onTaskClick);

  onDateChangeRef.current = onDateChange;
  onProgressChangeRef.current = onProgressChange;
  onTaskClickRef.current = onTaskClick;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const frappeTasks = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.computedStart,
      end: t.computedEnd,
      progress: t.progress,
      dependencies: t.dependencies.join(", "),
      custom_class: `section-${t.section.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
    }));

    const getScrollEl = () => mount.querySelector<HTMLElement>(".gantt-container");

    const applyContainerHeight = (height: number) => {
      if (!ganttRef.current || height < 120) return;
      const gantt = ganttRef.current as Gantt & {
        options: { container_height: number | "auto" };
        change_view_mode: (mode?: unknown, maintainPos?: boolean) => void;
      };
      if (gantt.options.container_height === height) return;
      gantt.options.container_height = height;
      gantt.change_view_mode(undefined, true);
    };

    if (!ganttRef.current) {
      ganttRef.current = new Gantt(mount, frappeTasks, {
        view_mode: viewMode,
        bar_height: 28,
        padding: 20,
        infinite_padding: false,
        scroll_to: "today",
        on_date_change: (task, start, end) => {
          onDateChangeRef.current(task.id, formatDate(start), formatDate(end));
        },
        on_progress_change: (task, progress) => {
          onProgressChangeRef.current(task.id, progress);
        },
        on_click: (task) => {
          onTaskClickRef.current?.(task.id);
        },
      });
    } else {
      const scrollEl = getScrollEl();
      const scrollLeft = scrollEl?.scrollLeft ?? 0;
      ganttRef.current.refresh(frappeTasks);
      if (scrollEl) scrollEl.scrollLeft = scrollLeft;
      (ganttRef.current as Gantt & { change_view_mode: (m: unknown, p?: boolean) => void }).change_view_mode(
        viewMode,
        true
      );
    }

    const ro = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) applyContainerHeight(Math.floor(height));
    });
    ro.observe(mount);

    return () => ro.disconnect();
  }, [tasks, viewMode]);

  return <div ref={mountRef} className="gantt-mount" />;
}
