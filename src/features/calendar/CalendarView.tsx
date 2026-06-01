import { useMemo, useState } from "react";
import type { Task } from "../../types/task";

interface CalendarViewProps {
  tasks: Task[];
}

function monthGrid(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const startWeekday = start.getDay();
  const daysInMonth = end.getDate();
  const cells: Array<{ day: number; inMonth: boolean; dateKey: string }> = [];

  for (let i = startWeekday; i > 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), 1 - i);
    cells.push({ day: d.getDate(), inMonth: false, dateKey: d.toISOString().slice(0, 10) });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(anchor.getFullYear(), anchor.getMonth(), d);
    cells.push({ day: d, inMonth: true, dateKey: date.toISOString().slice(0, 10) });
  }

  while (cells.length % 7 !== 0) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), daysInMonth + (cells.length % 7) + 1);
    cells.push({ day: d.getDate(), inMonth: false, dateKey: d.toISOString().slice(0, 10) });
  }

  return cells;
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(anchor);
  const cells = useMemo(() => monthGrid(anchor), [anchor]);

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const k = t.dueDate;
      const list = map.get(k) ?? [];
      list.push(t);
      map.set(k, list);
    });
    return map;
  }, [tasks]);

  return (
    <section className="card page-panel">
      <div className="page-panel-head calendar-head">
        <button className="icon-btn" onClick={() => setAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</button>
        <h2 className="calendar-title">{monthName}</h2>
        <button className="icon-btn" onClick={() => setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</button>
      </div>

      <div className="calendar-weekdays">
        {["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sab."].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell) => {
          const events = byDate.get(cell.dateKey) ?? [];
          return (
            <article key={cell.dateKey} className={`calendar-day ${cell.inMonth ? "" : "out-month"}`}>
              <strong>{cell.day}</strong>
              <div className="calendar-events">
                {events.slice(0, 3).map((e) => (
                  <span key={e.id} className={`calendar-chip chip-${e.status}`}>
                    {e.title}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
