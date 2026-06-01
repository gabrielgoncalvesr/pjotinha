interface SummaryCardsProps {
  total: number;
  pending: number;
  done: number;
  overdue: number;
}

export function SummaryCards({ total, pending, done, overdue }: SummaryCardsProps) {
  const items = [
    { label: "Total", value: total, tone: "total" },
    { label: "Pendentes", value: pending, tone: "pending" },
    { label: "Concluidas", value: done, tone: "done" },
    { label: "Atrasadas", value: overdue, tone: "overdue" },
  ];

  return (
    <section className="summary-grid summary-grid-compact">
      {items.map((item) => (
        <article key={item.label} className={`card summary-card summary-${item.tone}`}>
          <span className="summary-label">{item.label}</span>
          <strong className="summary-value">{item.value}</strong>
        </article>
      ))}
    </section>
  );
}
