import { useCallback, useEffect, useMemo, useState } from "react";
import { GanttChart } from "./components/GanttChart";
import { TaskEditor } from "./components/TaskEditor";
import { DEFAULT_PROJECT, INITIAL_MERMAID } from "./initialData";
import { parseMermaid, toMermaid } from "./mermaid";
import { applyDragDates, computeSchedule } from "./schedule";
import {
  insertTaskAt,
  moveSectionInList,
  moveTaskInList,
  renameSection,
  deleteSection,
  type InsertPosition,
} from "./taskOrder";
import { loadProject, loadServerProject, saveProject, saveServerProject } from "./storage";
import type { GanttProject, GanttTask } from "./types";
import "./App.css";

function nextTaskId(tasks: GanttTask[]): string {
  const used = new Set(tasks.map((t) => t.id));
  for (let i = 0; i < 1000; i++) {
    const id = `t${i}`;
    if (!used.has(id)) return id;
  }
  return `t${Date.now()}`;
}

export default function App() {
  const [project, setProject] = useState<GanttProject>(() => loadProject(DEFAULT_PROJECT));
  const [selectedId, setSelectedId] = useState<string | null>(project.tasks[0]?.id ?? null);
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");
  const [mermaidText, setMermaidText] = useState(INITIAL_MERMAID);
  const [showMermaid, setShowMermaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);

  const selectedTask = project.tasks.find((t) => t.id === selectedId) ?? null;

  const handleSelectTask = useCallback((id: string) => {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 900px)").matches) {
      setTasksOpen(true);
    }
  }, []);

  const scheduleResult = useMemo(() => {
    try {
      return { scheduled: computeSchedule(project), error: null as string | null };
    } catch (e) {
      return {
        scheduled: [] as ReturnType<typeof computeSchedule>,
        error: e instanceof Error ? e.message : "Schedule error",
      };
    }
  }, [project]);

  const { scheduled, error: scheduleError } = scheduleResult;
  const displayError = error ?? scheduleError;

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const serverProject = await loadServerProject();
      if (cancelled) return;
      if (serverProject) {
        setProject(serverProject);
        setSelectedId(serverProject.tasks[0]?.id ?? null);
        setMermaidText(toMermaid(serverProject));
      }
      setHydrated(true);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveProject(project);
    void saveServerProject(project);
  }, [project, hydrated]);

  const updateProject = useCallback((next: GanttProject) => {
    setProject(next);
    setMermaidText(toMermaid(next));
  }, []);

  const handleDrag = useCallback(
    (taskId: string, start: string, end: string) => {
      updateProject(applyDragDates(project, taskId, start, end));
    },
    [project, updateProject]
  );

  const handleProgress = useCallback(
    (taskId: string, progress: number) => {
      updateProject({
        ...project,
        tasks: project.tasks.map((t) => (t.id === taskId ? { ...t, progress } : t)),
      });
    },
    [project, updateProject]
  );

  const handleUpdateTask = (task: GanttTask) => {
    const oldId = project.tasks.find((t) => t.id === selectedId)?.id;
    const tasks = project.tasks.map((t) => {
      if (t.id === oldId || t.id === task.id) return task;
      return {
        ...t,
        dependencies: t.dependencies.map((d) => (d === oldId ? task.id : d)),
      };
    });
    if (selectedId === oldId && oldId !== task.id) setSelectedId(task.id);
    updateProject({ ...project, tasks });
  };

  const handleDelete = (id: string) => {
    const tasks = project.tasks
      .filter((t) => t.id !== id)
      .map((t) => ({
        ...t,
        dependencies: t.dependencies.filter((d) => d !== id),
      }));
    updateProject({ ...project, tasks });
    if (selectedId === id) setSelectedId(tasks[0]?.id ?? null);
  };

  const handleMoveTask = (taskId: string, direction: "up" | "down") => {
    updateProject({
      ...project,
      tasks: moveTaskInList(project.tasks, taskId, direction),
    });
  };

  const handleMoveSection = (section: string, direction: "up" | "down") => {
    const moved = moveSectionInList(project.sections, project.tasks, section, direction);
    if (!moved) return;
    updateProject({ ...project, sections: moved.sections, tasks: moved.tasks });
  };

  const handleAddTask = (section: string, position: InsertPosition = "end") => {
    const id = nextTaskId(project.tasks);
    const sectionTasks = project.tasks.filter((t) => t.section === section);
    const predecessor =
      position === "start"
        ? sectionTasks[0] ?? project.tasks[project.tasks.length - 1]
        : position === "end"
          ? sectionTasks[sectionTasks.length - 1] ?? project.tasks[project.tasks.length - 1]
          : project.tasks.find((t) => t.id === position);

    const task: GanttTask = {
      id,
      name: "New task",
      section,
      durationDays: 3,
      dependencies: predecessor ? [predecessor.id] : [],
      lagDays: 0,
      progress: 0,
    };
    updateProject({
      ...project,
      tasks: insertTaskAt(project.tasks, task, position),
    });
    setSelectedId(id);
    if (window.matchMedia("(max-width: 900px)").matches) {
      setTasksOpen(true);
    }
  };

  const handleAddSection = () => {
    const name = `Section ${project.sections.length + 1}`;
    updateProject({
      ...project,
      sections: [...project.sections, name],
    });
  };

  const handleRenameSection = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    if (project.sections.includes(trimmed)) {
      setError(`Section "${trimmed}" already exists`);
      return;
    }
    const renamed = renameSection(project.sections, project.tasks, oldName, trimmed);
    if (!renamed) return;
    updateProject({ ...project, sections: renamed.sections, tasks: renamed.tasks });
    setError(null);
  };

  const handleDeleteSection = (section: string) => {
    const sectionTasks = project.tasks.filter((t) => t.section === section);
    const message =
      sectionTasks.length === 0
        ? `Delete section "${section}"?`
        : `Delete section "${section}" and its ${sectionTasks.length} task${sectionTasks.length === 1 ? "" : "s"}?`;
    if (!confirm(message)) return;

    const deleted = deleteSection(project.sections, project.tasks, section);
    if (!deleted) return;

    updateProject({ ...project, sections: deleted.sections, tasks: deleted.tasks });
    if (selectedId && deleted.removedTaskIds.includes(selectedId)) {
      setSelectedId(deleted.tasks[0]?.id ?? null);
    }
    setError(null);
  };

  const applyMermaidImport = () => {
    try {
      const parsed = parseMermaid(mermaidText);
      updateProject(parsed);
      setSelectedId(parsed.tasks[0]?.id ?? null);
      setShowMermaid(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse Mermaid");
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "house-build-gantt.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as GanttProject;
        updateProject(parsed);
        setSelectedId(parsed.tasks[0]?.id ?? null);
      } catch {
        setError("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-primary">
          <div className="header-title-block">
            <h1>{project.title}</h1>
            <p className="subtitle">
              Drag bars to reschedule · click a bar or task to edit · auto-saved in browser
            </p>
          </div>
          <div className="header-primary-actions">
            <select
              className="view-mode-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              aria-label="Chart view mode"
            >
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
            </select>
            <button
              type="button"
              className="btn btn-icon header-menu-btn"
              aria-expanded={headerMenuOpen}
              aria-label={headerMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setHeaderMenuOpen((v) => !v)}
            >
              {headerMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        <div className={`header-actions ${headerMenuOpen ? "open" : ""}`}>
          <button type="button" className="btn" onClick={() => setShowMermaid((v) => !v)}>
            {showMermaid ? "Hide" : "Mermaid"}
          </button>
          <button type="button" className="btn" onClick={exportJson}>
            Export JSON
          </button>
          <label className="btn btn-file">
            Import JSON
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJson(file);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (confirm("Reset to default schedule?")) {
                updateProject(DEFAULT_PROJECT);
                setSelectedId("a1");
              }
            }}
          >
            Reset
          </button>
        </div>
      </header>

      {displayError && <div className="banner banner-error">{displayError}</div>}

      {showMermaid && (
        <div className="mermaid-panel">
          <textarea value={mermaidText} onChange={(e) => setMermaidText(e.target.value)} rows={14} spellCheck={false} />
          <div className="mermaid-actions">
            <button type="button" className="btn" onClick={applyMermaidImport}>
              Apply Mermaid
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMermaidText(toMermaid(project))}
            >
              Sync from chart
            </button>
          </div>
        </div>
      )}

      <main className={`main-layout ${tasksOpen ? "tasks-open" : ""}`}>
        <section className="chart-panel">
          {scheduled.length > 0 ? (
            <GanttChart
              tasks={scheduled}
              viewMode={viewMode}
              onDateChange={handleDrag}
              onProgressChange={handleProgress}
              onTaskClick={handleSelectTask}
            />
          ) : (
            <p className="empty-chart">Fix schedule errors to view the chart.</p>
          )}
        </section>
        <div className={`task-editor-shell ${tasksOpen ? "open" : ""}`}>
          <button
            type="button"
            className="task-panel-toggle"
            aria-expanded={tasksOpen}
            onClick={() => setTasksOpen((v) => !v)}
          >
            <span className="task-panel-toggle-label">
              {tasksOpen ? "Hide tasks" : "Tasks"}
            </span>
            {!tasksOpen && selectedTask && (
              <span className="task-panel-summary">
                {selectedTask.id} · {selectedTask.name}
              </span>
            )}
            <span className="task-panel-chevron" aria-hidden="true">
              {tasksOpen ? "▼" : "▲"}
            </span>
          </button>
          <div className="task-editor-body">
            <TaskEditor
              project={project}
              selectedId={selectedId}
              onSelect={handleSelectTask}
              onUpdate={handleUpdateTask}
              onDelete={handleDelete}
              onAdd={handleAddTask}
              onMove={handleMoveTask}
              onMoveSection={handleMoveSection}
              onRenameSection={handleRenameSection}
              onDeleteSection={handleDeleteSection}
              onAddSection={handleAddSection}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
