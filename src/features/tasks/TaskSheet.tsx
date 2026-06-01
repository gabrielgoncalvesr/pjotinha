import { useEffect, useMemo, useState } from "react";
import type { DueMode, Recurrence, Task, TaskCategory } from "../../types/task";

const categories: TaskCategory[] = ["Invoice", "Tax Document", "Payment", "Exchange", "Tax"];

interface TaskSheetProps {
  open: boolean;
  editingTask?: Task | null;
  onClose: () => void;
  onSave: (payload: Omit<Task, "id" | "priority"> & { id?: string }) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskSheet({ open, editingTask, onClose, onSave, onDeleteTask }: TaskSheetProps) {
  function toLocalIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [dueMode, setDueMode] = useState<DueMode | "">("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence | "">("");
  const [attemptedSave, setAttemptedSave] = useState(false);

  const dueModeOptions = useMemo(() => {
    if (recurrence === "monthly") {
      return [
        { value: "exact_date" as DueMode, label: "Day of month" },
        { value: "last_business_day" as DueMode, label: "Last business day" },
        { value: "last_day" as DueMode, label: "Last day of month" },
      ];
    }

    return [
      { value: "exact_date" as DueMode, label: "Specific date" },
      { value: "last_business_day" as DueMode, label: "Last business day" },
      { value: "last_day" as DueMode, label: "Last day of month" },
    ];
  }, [recurrence]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setCategory(editingTask.category);
      setDueMode(editingTask.dueMode);
      setDueDate(editingTask.dueDate);
      setRecurrence(editingTask.recurrence);
      setAttemptedSave(false);
      return;
    }

    setTitle("");
    setCategory("");
    setDueMode("");
    setDueDate("");
    setRecurrence("");
    setAttemptedSave(false);
  }, [editingTask, open]);

  useEffect(() => {
    if (dueMode !== "exact_date") {
      setDueDate("");
    }
  }, [dueMode]);

  useEffect(() => {
    if (!dueModeOptions.some((option) => option.value === dueMode)) {
      setDueMode("exact_date");
    }
  }, [dueMode, dueModeOptions]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const titleInvalid = attemptedSave && !title.trim();
  const categoryInvalid = attemptedSave && !category;
  const recurrenceInvalid = attemptedSave && !recurrence;
  const dueModeInvalid = attemptedSave && !dueMode;
  const dueDateInvalid = attemptedSave && dueMode === "exact_date" && !dueDate;

  function handleSave() {
    setAttemptedSave(true);
    if (!title.trim()) return;
    if (!category || !dueMode || !recurrence) return;
    if (dueMode === "exact_date" && !dueDate) return;

    onSave({
      id: editingTask?.id,
      title: title.trim(),
      category,
      status: editingTask?.status ?? "pending",
      dueMode,
      dueDate,
      recurrence,
    });
    onClose();
  }

  return (
    <div className={`sheet-backdrop ${open ? "sheet-open" : ""}`} onClick={onClose}>
      <aside className="task-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{editingTask ? "Edit task" : "New task"}</h3>

        <label>Title</label>
        <input className={titleInvalid ? "field-error" : ""} value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Category</label>
        <select className={categoryInvalid ? "field-error" : ""} value={category} onChange={(e) => setCategory(e.target.value as TaskCategory | "")}>
          <option value="">Select category</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label>Type</label>
        <select className={recurrenceInvalid ? "field-error" : ""} value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence | "")}>
          <option value="">Select type</option>
          <option value="none">Non recurring</option>
          <option value="monthly">Recurring monthly</option>
        </select>

        <label>Due rule</label>
        <select className={dueModeInvalid ? "field-error" : ""} value={dueMode} onChange={(e) => setDueMode(e.target.value as DueMode | "")}>
          <option value="">Select due rule</option>
          {dueModeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {dueMode === "exact_date" && (
          <>
            <label>{recurrence === "monthly" ? "Day" : "Date"}</label>
            <input
              className={dueDateInvalid ? "field-error" : ""}
              type={recurrence === "monthly" ? "number" : "date"}
              min={recurrence === "monthly" ? "1" : undefined}
              max={recurrence === "monthly" ? "31" : undefined}
              value={recurrence === "monthly" ? (dueDate ? String(new Date(`${dueDate}T00:00:00`).getDate()) : "") : dueDate}
              onChange={(e) => {
                if (recurrence === "monthly") {
                  const day = Number(e.target.value);
                  if (!Number.isFinite(day) || day < 1 || day > 31) {
                    setDueDate("");
                    return;
                  }
                  const month = new Date().getMonth();
                  const year = new Date().getFullYear();
                  const value = toLocalIsoDate(new Date(year, month, day));
                  setDueDate(value);
                  return;
                }
                setDueDate(e.target.value);
              }}
            />
          </>
        )}

        <div className="sheet-actions">
          {editingTask && (
            <button className="toggle-btn toggle-btn-danger" onClick={() => onDeleteTask(editingTask.id)}>
              Delete
            </button>
          )}
          <button className="toggle-btn" onClick={onClose}>Cancel</button>
          <button className="toggle-btn toggle-btn-primary" onClick={handleSave}>Save</button>
        </div>
      </aside>
    </div>
  );
}
