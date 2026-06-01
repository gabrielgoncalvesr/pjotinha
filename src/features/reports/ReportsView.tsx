import type { Task } from "../../types/task";

interface ReportsViewProps {
  tasks: Task[];
}

export function ReportsView({ tasks }: ReportsViewProps) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const overdue = tasks.filter((task) => task.status === "overdue").length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <section className="card page-panel">
      <div className="page-panel-head">
        <h2>Relatorios</h2>
        <p>Indicadores rapidos para acompanhamento do mes.</p>
      </div>

      <div className="report-grid">
        <article className="report-card">
          <span>Taxa de conclusao</span>
          <strong>{completionRate}%</strong>
        </article>
        <article className="report-card">
          <span>Pendentes</span>
          <strong>{pending}</strong>
        </article>
        <article className="report-card">
          <span>Atrasadas</span>
          <strong>{overdue}</strong>
        </article>
      </div>
    </section>
  );
}
