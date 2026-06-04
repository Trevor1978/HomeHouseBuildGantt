import { useState } from "react";
import type { InsertPosition } from "../taskOrder";
import { canMoveSection, canMoveTask } from "../taskOrder";
import type { GanttProject, GanttTask } from "../types";

interface Props {
  project: GanttProject;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (task: GanttTask) => void;
  onDelete: (id: string) => void;
  onAdd: (section: string, position: InsertPosition) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onMoveSection: (section: string, direction: "up" | "down") => void;
  onAddSection: () => void;
}

export function TaskEditor({
  project,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onAdd,
  onMove,
  onMoveSection,
  onAddSection,
}: Props) {
  const selected = project.tasks.find((t) => t.id === selectedId) ?? null;
  const taskIds = project.tasks.map((t) => t.id);
  const [addForSection, setAddForSection] = useState<string | null>(null);
  const [insertPosition, setInsertPosition] = useState<InsertPosition>("end");

  const openAddPanel = (section: string) => {
    setAddForSection(section);
    setInsertPosition("end");
  };

  const confirmAdd = () => {
    if (!addForSection) return;
    onAdd(addForSection, insertPosition);
    setAddForSection(null);
  };

  return (
    <aside className="task-editor">
      <div className="task-editor-header">
        <h2>Tasks</h2>
        <button type="button" className="btn btn-small" onClick={onAddSection}>
          + Section
        </button>
      </div>

      {selected && (
        <form
          className="task-form task-form-top"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <h3>Edit task</h3>

          <label>
            ID
            <input
              value={selected.id}
              onChange={(e) => onUpdate({ ...selected, id: e.target.value.trim() })}
            />
          </label>

          <label>
            Name
            <input
              value={selected.name}
              onChange={(e) => onUpdate({ ...selected, name: e.target.value })}
            />
          </label>

          <label>
            Section
            <select
              value={selected.section}
              onChange={(e) => onUpdate({ ...selected, section: e.target.value })}
            >
              {project.sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="task-order-actions">
            <span className="task-order-label">List order</span>
            <button
              type="button"
              className="btn btn-small"
              disabled={!canMoveTask(project.tasks, selected.id, "up")}
              onClick={() => onMove(selected.id, "up")}
              title="Move up in section"
            >
              ↑ Up
            </button>
            <button
              type="button"
              className="btn btn-small"
              disabled={!canMoveTask(project.tasks, selected.id, "down")}
              onClick={() => onMove(selected.id, "down")}
              title="Move down in section"
            >
              ↓ Down
            </button>
          </div>

          <label>
            Duration (days)
            <input
              type="number"
              min={1}
              value={selected.durationDays}
              onChange={(e) =>
                onUpdate({ ...selected, durationDays: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </label>

          <label>
            Progress (%)
            <input
              type="range"
              min={0}
              max={100}
              value={selected.progress}
              onChange={(e) => onUpdate({ ...selected, progress: Number(e.target.value) })}
            />
            <span>{selected.progress}%</span>
          </label>

          <fieldset className="schedule-fieldset">
            <legend>Schedule</legend>
            <label className="radio-row">
              <input
                type="radio"
                name="schedule-mode"
                checked={!!selected.startDate}
                onChange={() =>
                  onUpdate({
                    ...selected,
                    startDate: selected.startDate ?? "2026-05-25",
                    dependencies: [],
                  })
                }
              />
              Fixed start date
            </label>
            {selected.startDate !== undefined && (
              <input
                type="date"
                value={selected.startDate}
                onChange={(e) => onUpdate({ ...selected, startDate: e.target.value })}
              />
            )}

            <label className="radio-row">
              <input
                type="radio"
                name="schedule-mode"
                checked={!selected.startDate}
                onChange={() =>
                  onUpdate({
                    ...selected,
                    startDate: undefined,
                    dependencies: selected.dependencies.length
                      ? selected.dependencies
                      : [taskIds[0] ?? ""].filter(Boolean),
                  })
                }
              />
              After dependency
            </label>
            {!selected.startDate && (
              <>
                <fieldset className="dependency-picker">
                  <legend>Depends on (all must finish)</legend>
                  {taskIds.filter((id) => id !== selected.id).length === 0 ? (
                    <p className="dependency-empty">No other tasks to depend on.</p>
                  ) : (
                    <ul className="dependency-list">
                      {taskIds
                        .filter((id) => id !== selected.id)
                        .map((id) => {
                          const depTask = project.tasks.find((t) => t.id === id);
                          return (
                            <li key={id}>
                              <label className="checkbox-row">
                                <input
                                  type="checkbox"
                                  checked={selected.dependencies.includes(id)}
                                  onChange={(e) => {
                                    const deps = e.target.checked
                                      ? [...selected.dependencies, id]
                                      : selected.dependencies.filter((d) => d !== id);
                                    onUpdate({ ...selected, dependencies: deps });
                                  }}
                                />
                                <span>
                                  <span className="task-id">{id}</span>{" "}
                                  {depTask?.name ?? ""}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </fieldset>
                <label>
                  Days after dependency ends
                  <input
                    type="number"
                    min={0}
                    value={selected.lagDays ?? 0}
                    onChange={(e) =>
                      onUpdate({
                        ...selected,
                        lagDays: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </label>
              </>
            )}
          </fieldset>

          <button type="button" className="btn btn-danger" onClick={() => onDelete(selected.id)}>
            Delete task
          </button>
        </form>
      )}

      <div className="task-editor-list">
        <div className="task-sections">
          {project.sections.map((section) => {
            const sectionTasks = project.tasks.filter((t) => t.section === section);
            const showAdd = addForSection === section;

            return (
              <div key={section} className="task-section-block">
                <div className="task-section-title">
                  <div className="task-section-reorder">
                    <button
                      type="button"
                      className="btn-reorder"
                      disabled={!canMoveSection(project.sections, section, "up")}
                      onClick={() => onMoveSection(section, "up")}
                      title="Move section up"
                      aria-label={`Move ${section} up`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn-reorder"
                      disabled={!canMoveSection(project.sections, section, "down")}
                      onClick={() => onMoveSection(section, "down")}
                      title="Move section down"
                      aria-label={`Move ${section} down`}
                    >
                      ↓
                    </button>
                  </div>
                  <span className="task-section-name">{section}</span>
                  <button type="button" className="btn btn-small" onClick={() => openAddPanel(section)}>
                    + Task
                  </button>
                </div>

                {showAdd && (
                  <div className="task-add-panel">
                    <label>
                      Insert position
                      <select
                        value={insertPosition}
                        onChange={(e) => setInsertPosition(e.target.value as InsertPosition)}
                      >
                        <option value="start">At start of section</option>
                        <option value="end">At end of section</option>
                        {sectionTasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            After {t.id} — {t.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="task-add-actions">
                      <button type="button" className="btn btn-small" onClick={confirmAdd}>
                        Add task
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-ghost"
                        onClick={() => setAddForSection(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <ul className="task-list">
                  {sectionTasks.map((task) => (
                    <li key={task.id} className="task-list-row">
                      <div className="task-list-reorder">
                        <button
                          type="button"
                          className="btn-reorder"
                          disabled={!canMoveTask(project.tasks, task.id, "up")}
                          onClick={() => onMove(task.id, "up")}
                          title="Move up"
                          aria-label={`Move ${task.name} up`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn-reorder"
                          disabled={!canMoveTask(project.tasks, task.id, "down")}
                          onClick={() => onMove(task.id, "down")}
                          title="Move down"
                          aria-label={`Move ${task.name} down`}
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`task-list-item ${selectedId === task.id ? "active" : ""}`}
                        onClick={() => onSelect(task.id)}
                      >
                        <span className="task-id">{task.id}</span>
                        <span className="task-name">{task.name}</span>
                        <span className="task-meta">
                          {task.durationDays}d
                          {!task.startDate && (task.lagDays ?? 0) > 0 ? ` +${task.lagDays}d` : ""}
                          {!task.startDate && task.dependencies.length > 0
                            ? ` · after ${task.dependencies.join(", ")}`
                            : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
