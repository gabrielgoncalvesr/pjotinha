export type TaskStatus = "pending" | "done" | "overdue";

export type TaskCategory =
  | "Invoice"
  | "Tax Document"
  | "Payment"
  | "Exchange"
  | "Tax";

export type DueMode = "exact_date" | "last_day" | "last_business_day";
export type Recurrence = "none" | "monthly";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string;
  dueMode: DueMode;
  recurrence: Recurrence;
  status: TaskStatus;
  priority: number;
}
