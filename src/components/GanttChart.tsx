import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
import { formatDate } from "../dateUtils";
import type { ScheduledTask } from "../types";

type GanttInstance = Gantt & {
  options: { container_height: number | "auto"; scroll_to: string | null };
  change_view_mode: (mode?: unknown, maintainPos?: boolean) => void;
  set_scroll_position: (date: string) => void;
};

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
  const userScrollRef = useRef(false);
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

    const scrollToToday = (gantt: GanttInstance) => {
      gantt.set_scroll_position("today");
    };

    const markUserScroll = () => {
      userScrollRef.current = true;
    };

    const applyContainerHeight = (height: number) => {
      if (!ganttRef.current || height < 120) return;
      const gantt = ganttRef.current as GanttInstance;
      if (gantt.options.container_height === height) return;
      gantt.options.container_height = height;
      const maintainPos = userScrollRef.current;
      gantt.change_view_mode(undefined, maintainPos);
      if (!maintainPos) {
        requestAnimationFrame(() => scrollToToday(gantt));
      }
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
      requestAnimationFrame(() => {
        if (ganttRef.current) scrollToToday(ganttRef.current as GanttInstance);
      });
    } else {
      const scrollEl = getScrollEl();
      const scrollLeft = scrollEl?.scrollLeft ?? 0;
      const maintainPos = userScrollRef.current;
      ganttRef.current.refresh(frappeTasks);
      if (scrollEl && maintainPos) {
        scrollEl.scrollLeft = scrollLeft;
      }
      (ganttRef.current as GanttInstance).change_view_mode(viewMode, maintainPos);
      if (!maintainPos) {
        requestAnimationFrame(() => {
          if (ganttRef.current) scrollToToday(ganttRef.current as GanttInstance);
        });
      }
    }

    const scrollEl = getScrollEl();
    scrollEl?.addEventListener("wheel", markUserScroll, { passive: true });
    scrollEl?.addEventListener("touchstart", markUserScroll, { passive: true });
    scrollEl?.addEventListener("pointerdown", markUserScroll, { passive: true });

    const ro = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) applyContainerHeight(Math.floor(height));
    });
    ro.observe(mount);

    return () => {
      ro.disconnect();
      scrollEl?.removeEventListener("wheel", markUserScroll);
      scrollEl?.removeEventListener("touchstart", markUserScroll);
      scrollEl?.removeEventListener("pointerdown", markUserScroll);
    };
  }, [tasks, viewMode]);

  return <div ref={mountRef} className="gantt-mount" />;
}
