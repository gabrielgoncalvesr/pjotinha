import { SummaryCards } from "../../components/SummaryCards";
import type { Task } from "../../types/task";

interface DashboardViewProps {
  tasks: Task[];
}

export function DashboardView({ tasks }: DashboardViewProps) {
  const total = tasks.length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const done = tasks.filter((task) => task.status === "done").length;
  const overdue = tasks.filter((task) => task.status === "overdue").length;

  return (
    <section>
      <SummaryCards total={total} pending={pending} done={done} overdue={overdue} />
    </section>
  );
}
