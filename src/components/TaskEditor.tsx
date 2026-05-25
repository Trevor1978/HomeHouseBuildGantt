import type { GanttProject, GanttTask } from "../types";

interface Props {
  project: GanttProject;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (task: GanttTask) => void;
  onDelete: (id: string) => void;
  onAdd: (section: string) => void;
  onAddSection: () => void;
}

export function TaskEditor({
  project,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onAdd,
  onAddSection,
}: Props) {
  const selected = project.tasks.find((t) => t.id === selectedId) ?? null;
  const taskIds = project.tasks.map((t) => t.id);

  return (
    <aside className="task-editor">
      <div className="task-editor-header">
        <h2>Tasks</h2>
        <button type="button" className="btn btn-small" onClick={onAddSection}>
          + Section
        </button>
      </div>

      <div className="task-sections">
        {project.sections.map((section) => {
          const sectionTasks = project.tasks.filter((t) => t.section === section);
          return (
            <div key={section} className="task-section-block">
              <div className="task-section-title">
                <span>{section}</span>
                <button type="button" className="btn btn-small" onClick={() => onAdd(section)}>
                  + Task
                </button>
              </div>
              <ul className="task-list">
                {sectionTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      className={`task-list-item ${selectedId === task.id ? "active" : ""}`}
                      onClick={() => onSelect(task.id)}
                    >
                      <span className="task-id">{task.id}</span>
                      <span className="task-name">{task.name}</span>
                      <span className="task-meta">{task.durationDays}d</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {selected && (
        <form
          className="task-form"
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
                    dependencies: selected.dependencies.length ? selected.dependencies : [taskIds[0] ?? ""].filter(Boolean),
                  })
                }
              />
              After dependency
            </label>
            {!selected.startDate && (
              <select
                value={selected.dependencies[0] ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...selected,
                    dependencies: e.target.value ? [e.target.value] : [],
                  })
                }
              >
                <option value="">— select —</option>
                {taskIds
                  .filter((id) => id !== selected.id)
                  .map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
              </select>
            )}
          </fieldset>

          <button type="button" className="btn btn-danger" onClick={() => onDelete(selected.id)}>
            Delete task
          </button>
        </form>
      )}
    </aside>
  );
}
