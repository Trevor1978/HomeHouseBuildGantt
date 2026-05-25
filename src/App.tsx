import { useCallback, useEffect, useMemo, useState } from "react";
import { GanttChart } from "./components/GanttChart";
import { TaskEditor } from "./components/TaskEditor";
import { DEFAULT_PROJECT, INITIAL_MERMAID } from "./initialData";
import { parseMermaid, toMermaid } from "./mermaid";
import { applyDragDates, computeSchedule } from "./schedule";
import { loadProject, saveProject } from "./storage";
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
    saveProject(project);
  }, [project]);

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

  const handleAddTask = (section: string) => {
    const id = nextTaskId(project.tasks);
    const task: GanttTask = {
      id,
      name: "New task",
      section,
      durationDays: 3,
      dependencies: project.tasks[0] ? [project.tasks[0].id] : [],
      progress: 0,
    };
    updateProject({ ...project, tasks: [...project.tasks, task] });
    setSelectedId(id);
  };

  const handleAddSection = () => {
    const name = `Section ${project.sections.length + 1}`;
    updateProject({
      ...project,
      sections: [...project.sections, name],
    });
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
        <div>
          <h1>{project.title}</h1>
          <p className="subtitle">Drag bars to reschedule · edit tasks in the sidebar · auto-saved in browser</p>
        </div>
        <div className="header-actions">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value as typeof viewMode)}>
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
          </select>
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

      <main className="main-layout">
        <TaskEditor
          project={project}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdate={handleUpdateTask}
          onDelete={handleDelete}
          onAdd={handleAddTask}
          onAddSection={handleAddSection}
        />
        <section className="chart-panel">
          {scheduled.length > 0 ? (
            <GanttChart
              tasks={scheduled}
              viewMode={viewMode}
              onDateChange={handleDrag}
              onProgressChange={handleProgress}
            />
          ) : (
            <p className="empty-chart">Fix schedule errors to view the chart.</p>
          )}
        </section>
      </main>
    </div>
  );
}
