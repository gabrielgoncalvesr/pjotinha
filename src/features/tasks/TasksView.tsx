import { useMemo, useState } from "react";
import type { Task } from "../../types/task";
import { formatDate } from "../../lib/date";
import { TaskSheet } from "./TaskSheet";

interface TasksViewProps {
  tasks: Task[];
  onToggleDone: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMovePriority: (taskId: string, direction: "up" | "down") => void;
  onUpsertTask: (payload: Omit<Task, "id" | "priority"> & { id?: string }) => void;
}

export function TasksView({ tasks, onToggleDone, onDeleteTask, onMovePriority, onUpsertTask }: TasksViewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const ordered = useMemo(() => [...tasks].sort((a, b) => a.priority - b.priority), [tasks]);

  return (
    <section className="card page-panel tasks-page">
      <div className="page-panel-head row-between">
        <div><h2>Tarefas</h2><p>Recorrentes e nao recorrentes com prioridade.</p></div>
      </div>

      <div className="task-table-head"><span>Titulo</span><span>Categoria</span><span>Vencimento</span><span>Tipo</span><span>Status</span><span>Acoes</span></div>
      <ul className="task-list">
        {ordered.map((task) => (
          <li key={task.id} className="task-item task-item-advanced">
            <div><strong className="task-title">{task.title}</strong><p className="task-meta">Prioridade {task.priority}</p></div>
            <span>{task.category}</span>
            <span>{task.dueMode === "exact_date" ? formatDate(task.dueDate) : task.dueMode === "last_day" ? "Ultimo dia do mes" : "Ultimo dia util"}</span>
            <span>{task.recurrence === "monthly" ? "Recorrente" : "Unica"}</span>
            <span className={`status-badge status-${task.status}`}>{task.status}</span>
            <div className="task-actions-compact">
              <button className="icon-btn" title="Subir" onClick={() => onMovePriority(task.id, "up")}>↑</button>
              <button className="icon-btn" title="Descer" onClick={() => onMovePriority(task.id, "down")}>↓</button>
              <button className="icon-btn" title="Editar" onClick={() => { setEditingTask(task); setSheetOpen(true); }}>✎</button>
              <button className="icon-btn" title="Excluir" onClick={() => onDeleteTask(task.id)}>🗑</button>
              <button className="icon-btn" title="Concluir" onClick={() => onToggleDone(task.id)}>✓</button>
            </div>
          </li>
        ))}
      </ul>

      <button className="fab-add" onClick={() => { setEditingTask(null); setSheetOpen(true); }} aria-label="Adicionar tarefa">+</button>
      <TaskSheet
        open={sheetOpen}
        editingTask={editingTask}
        onClose={() => setSheetOpen(false)}
        onSave={onUpsertTask}
        onDeleteTask={onDeleteTask}
      />
    </section>
  );
}
