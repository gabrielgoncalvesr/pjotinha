import { useState } from "react";
import type { DueMode, Recurrence, Task, TaskCategory, TaskStatus } from "../../types/task";

interface SettingsViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "priority">) => void;
  onUpdateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "priority">>) => void;
}

const categories: TaskCategory[] = ["Invoice", "Tax Document", "Payment", "Exchange", "Tax"];
const statuses: TaskStatus[] = ["pending", "done", "overdue"];
const modes: DueMode[] = ["exact_date", "last_day", "last_business_day"];
const recurrences: Recurrence[] = ["none", "monthly"];

export function SettingsView({ tasks, onAddTask, onUpdateTask }: SettingsViewProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Invoice");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [dueMode, setDueMode] = useState<DueMode>("exact_date");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");

  function handleCreateTask(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAddTask({ title: title.trim(), category, dueDate, status, dueMode, recurrence });
  }

  return <section className="card page-panel"><form onSubmit={handleCreateTask}><input value={title} onChange={(e) => setTitle(e.target.value)} /><select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>{categories.map((c)=><option key={c}>{c}</option>)}</select><select value={dueMode} onChange={(e) => setDueMode(e.target.value as DueMode)}>{modes.map((m)=><option key={m}>{m}</option>)}</select><select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>{recurrences.map((r)=><option key={r}>{r}</option>)}</select><input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} /><select value={status} onChange={(e)=>setStatus(e.target.value as TaskStatus)}>{statuses.map((s)=><option key={s}>{s}</option>)}</select><button type="submit">Salvar</button></form>{tasks.map((t)=><div key={t.id}><input value={t.title} onChange={(e)=>onUpdateTask(t.id,{title:e.target.value})} /></div>)}</section>;
}
