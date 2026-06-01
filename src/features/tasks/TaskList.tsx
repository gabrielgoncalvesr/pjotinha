import type { Task } from "../../types/task";
import { TaskItem } from "../../components/TaskItem";

interface TaskListProps {
  tasks: Task[];
  onToggleDone: (taskId: string) => void;
}

export function TaskList({ tasks, onToggleDone }: TaskListProps) {
  return (
    <section className="card task-list-wrapper">
      <div className="task-list-header">
        <h2>Tarefas do mes</h2>
      </div>

      <ul className="task-list">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggleDone={onToggleDone} />
        ))}
      </ul>
    </section>
  );
}
