import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { mockTasks } from "./features/tasks/mockTasks";
import { TaskSheet } from "./features/tasks/TaskSheet";
import { formatDate } from "./lib/date";
import type { Task } from "./types/task";

const TASKS_STORAGE_KEY = "pjotinha.tasks.v1";
const DONE_STORAGE_KEY = "pjotinha.doneByMonth.v1";

function loadStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return mockTasks;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return mockTasks;
    return parsed as Task[];
  } catch {
    return mockTasks;
  }
}

function loadStoredDoneByMonth(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(DONE_STORAGE_KEY);
    if (!raw) return { "2026-05": ["t4", "t5"] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string[]>;
  } catch {
    return {};
  }
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateSortKey(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return Number.NEGATIVE_INFINITY;
  return y * 10000 + m * 100 + d;
}

function lastBusinessDayOfMonth(year: number, month: number) {
  const date = new Date(year, month + 1, 0);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }
  return date;
}

function projectedTaskForMonth(task: Task, anchor: Date): Task | null {
  const taskDate = new Date(`${task.dueDate}T00:00:00`);
  const isSameMonth = taskDate.getFullYear() === anchor.getFullYear() && taskDate.getMonth() === anchor.getMonth();

  if (task.recurrence === "none" && !isSameMonth) {
    return null;
  }

  const year = task.recurrence === "monthly" ? anchor.getFullYear() : taskDate.getFullYear();
  const month = task.recurrence === "monthly" ? anchor.getMonth() : taskDate.getMonth();

  if (task.dueMode === "last_day") {
    return { ...task, dueDate: isoDate(new Date(year, month + 1, 0)) };
  }

  if (task.dueMode === "last_business_day") {
    return { ...task, dueDate: isoDate(lastBusinessDayOfMonth(year, month)) };
  }

  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(taskDate.getDate(), lastDay);
  return { ...task, dueDate: isoDate(new Date(year, month, day)) };
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadStoredTasks());
  const [anchor, setAnchor] = useState(() => new Date(2026, 4, 1));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [doneByMonth, setDoneByMonth] = useState<Record<string, string[]>>(() => loadStoredDoneByMonth());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function hydrateFromDb() {
      try {
        const state = await invoke<{ tasks: Task[]; done_by_month: Record<string, string[]> } | null>("load_task_state");
        if (cancelled) return;
        if (state) {
          setTasks(state.tasks);
          setDoneByMonth(state.done_by_month ?? {});
        } else {
          await invoke("save_task_state", {
            tasksJson: JSON.stringify(tasks),
            doneByMonthJson: JSON.stringify(doneByMonth),
          });
        }
      } catch {
        // Keep local fallback.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    hydrateFromDb();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    invoke("save_task_state", {
      tasksJson: JSON.stringify(tasks),
      doneByMonthJson: JSON.stringify(doneByMonth),
    }).catch(() => {
      // Ignore persistence errors, keep app responsive.
    });
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    localStorage.setItem(DONE_STORAGE_KEY, JSON.stringify(doneByMonth));
  }, [doneByMonth, hydrated, tasks]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(anchor),
    [anchor],
  );
  const monthLabelTitle = monthLabel.slice(0, 1).toUpperCase() + monthLabel.slice(1);

  const currentMonthKey = monthKey(anchor);
  const ordered = useMemo(
    () =>
      tasks
        .map((task) => projectedTaskForMonth(task, anchor))
        .filter((task): task is Task => Boolean(task))
        .map((task) => ({
          ...task,
          status: ((doneByMonth[monthKey(anchor)] ?? []).includes(task.id) ? "done" : "pending") as Task["status"],
        }))
        .sort((a, b) => dateSortKey(a.dueDate) - dateSortKey(b.dueDate)),
    [anchor, doneByMonth, tasks],
  );
  const completedThisMonth = doneByMonth[currentMonthKey] ?? [];

  function upsertTask(payload: Omit<Task, "id" | "priority"> & { id?: string; priority?: number }) {
    if (payload.id) {
      setTasks((prev) => {
        const current = [...prev].sort((a, b) => a.priority - b.priority);
        const index = current.findIndex((task) => task.id === payload.id);
        if (index < 0) return prev;

        const updated = { ...current[index], ...payload };
        current.splice(index, 1);

        const rawTarget = payload.priority ?? updated.priority ?? current.length + 1;
        const target = Math.min(Math.max(rawTarget - 1, 0), current.length);
        current.splice(target, 0, updated as Task);

        return current.map((task, idx) => ({ ...task, priority: idx + 1 }));
      });
      return;
    }
    setTasks((prev) => [...prev, { ...payload, id: crypto.randomUUID(), priority: prev.length + 1 }]);
  }

  function toggleDone(taskId: string) {
    setDoneByMonth((prev) => {
      const current = prev[currentMonthKey] ?? [];
      const next = current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId];
      return { ...prev, [currentMonthKey]: next };
    });
  }

  function removeTask(taskId: string) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setDoneByMonth((prev) => {
      const next: Record<string, string[]> = {};
      for (const [key, ids] of Object.entries(prev)) {
        next[key] = ids.filter((id) => id !== taskId);
      }
      return next;
    });
  }

  return (
    <main className="fixed-app-wrap">
      <section className="fixed-app">
        <header className="mobile-head-simple">
          <div className="month-nav">
            <button className="month-nav-btn" onClick={() => setAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} aria-label="Previous month">
              &lt;
            </button>
            <h1>{monthLabelTitle}</h1>
            <button className="month-nav-btn" onClick={() => setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} aria-label="Next month">
              &gt;
            </button>
          </div>
        </header>

        <ul className="mobile-task-list">
          {ordered.map((task) => (
            <li key={task.id} className="mobile-task-row">
              <label className="check-wrap">
                <input
                  type="checkbox"
                  checked={completedThisMonth.includes(task.id)}
                  onChange={() => toggleDone(task.id)}
                />
                <span aria-hidden="true" />
              </label>
              <button className="task-text-btn" onClick={() => { setEditingTask(task); setSheetOpen(true); }}>
                <strong className={completedThisMonth.includes(task.id) ? "is-done" : ""}>{task.title}</strong>
              </button>
              <span className="task-due-col">{formatDate(task.dueDate, "pt-BR")}</span>
              <span className={`task-status-badge status-${task.status}`}>{task.status}</span>
            </li>
          ))}
        </ul>

        <button className="fab-add" onClick={() => { setEditingTask(null); setSheetOpen(true); }} aria-label="New task">
          <span aria-hidden="true">+</span> New Task
        </button>
      </section>

      <TaskSheet
        open={sheetOpen}
        editingTask={editingTask}
        onClose={() => setSheetOpen(false)}
        onSave={upsertTask}
        onDeleteTask={(taskId) => {
          removeTask(taskId);
          setSheetOpen(false);
          setEditingTask(null);
        }}
      />
    </main>
  );
}

export default App;
