export interface AgendaTask {
  id: string;
  date: string; // yyyy-MM-dd
  title: string;
  completed: boolean;
  createdAt: string; // ISO timestamp
  reminderTime?: string; // HH:mm format, optional
  order: number;
}

export interface DayTaskSummary {
  total: number;
  completed: number;
}

/**
 * Gelecekte cihaz takvimi (Google Calendar / Apple Calendar) senkronizasyonu
 * eklenebilmesi için veri katmanını soyutlayan TaskRepository arayüzü.
 */
export interface TaskRepository {
  getTasksForDate(date: string): Promise<AgendaTask[]>;
  addTask(date: string, title: string, reminderTime?: string): Promise<AgendaTask>;
  toggleTask(date: string, taskId: string): Promise<boolean>;
  deleteTask(date: string, taskId: string): Promise<void>;
  carryTaskToTomorrow(date: string, taskId: string): Promise<AgendaTask | null>;
  getMonthlyTaskSummaries(yearMonth: string): Promise<Record<string, DayTaskSummary>>;
}
