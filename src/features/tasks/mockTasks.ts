import type { Task } from "../../types/task";

export const mockTasks: Task[] = [
  { id: "t1", title: "Generate client A invoice", category: "Invoice", dueDate: "2026-05-02", dueMode: "exact_date", recurrence: "monthly", status: "pending", priority: 1 },
  { id: "t2", title: "Issue tax document for project X", category: "Tax Document", dueDate: "2026-05-04", dueMode: "exact_date", recurrence: "monthly", status: "pending", priority: 2 },
  { id: "t3", title: "Confirm received payment", category: "Payment", dueDate: "2026-05-01", dueMode: "exact_date", recurrence: "none", status: "pending", priority: 3 },
  { id: "t4", title: "Register received exchange amount", category: "Exchange", dueDate: "2026-05-06", dueMode: "exact_date", recurrence: "none", status: "pending", priority: 4 },
  { id: "t5", title: "Review tax payment guide", category: "Tax", dueDate: "2026-05-28", dueMode: "exact_date", recurrence: "monthly", status: "pending", priority: 5 },
];
