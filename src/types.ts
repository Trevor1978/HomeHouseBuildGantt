export interface GanttTask {
  id: string;
  name: string;
  section: string;
  /** Fixed calendar start (YYYY-MM-DD). Omit when using dependency-only scheduling. */
  startDate?: string;
  durationDays: number;
  /** Task ids this task starts after (Mermaid "after" deps). */
  dependencies: string[];
  /** Days after the latest dependency ends before this task starts (dependency mode only). */
  lagDays: number;
  progress: number;
}

export interface GanttProject {
  title: string;
  dateFormat: string;
  axisFormat: string;
  sections: string[];
  tasks: GanttTask[];
}

export interface ScheduledTask extends GanttTask {
  computedStart: string;
  computedEnd: string;
}
