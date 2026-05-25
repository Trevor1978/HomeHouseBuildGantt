/// <reference types="vite/client" />

declare module "frappe-gantt" {
  export interface FrappeTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    custom_class?: string;
  }

  export interface GanttOptions {
    view_mode?: "Quarter Day" | "Half Day" | "Day" | "Week" | "Month";
    bar_height?: number;
    padding?: number;
    infinite_padding?: boolean;
    scroll_to?: "today" | "start" | "end" | string | null;
    container_height?: number | "auto";
    on_date_change?: (task: FrappeTask, start: Date, end: Date) => void;
    on_progress_change?: (task: FrappeTask, progress: number) => void;
    on_click?: (task: FrappeTask) => void;
  }

  export default class Gantt {
    constructor(
      element: HTMLElement | string,
      tasks: FrappeTask[],
      options?: GanttOptions
    );
    options: GanttOptions & { container_height?: number | "auto" };
    change_view_mode(mode?: GanttOptions["view_mode"], maintainPos?: boolean): void;
    refresh(tasks: FrappeTask[]): void;
  }
}
