import { formatDate } from "../lib/date";
import type { Task } from "../types/task";

interface TaskItemProps {
  task: Task;
  onToggleDone: (taskId: string) => void;
}

export function TaskItem({ task, onToggleDone }: TaskItemProps) {
  return (
    <li className="task-item">
      <div className="task-main">
        <h3 className="task-title">{task.title}</h3>
        <p className="task-meta">{task.category}</p>
      </div>

      <p className="task-due">Vence em {formatDate(task.dueDate)}</p>

      <span className={`status-badge status-${task.status}`}>{task.status}</span>

      <button className="toggle-btn" onClick={() => onToggleDone(task.id)}>
        {task.status === "done" ? "Desmarcar" : "Marcar como feita"}
      </button>
    </li>
  );
}
