import { addDays, format, parseISO } from 'date-fns';
import i18n from './i18n';
import type { AgendaTask, DayTaskSummary } from '../types/agenda';

/**
 * Carries an uncompleted task to tomorrow ('yyyy-MM-dd' + 1 day).
 */
export function carryTaskToTomorrowLogic(task: AgendaTask): AgendaTask {
  const currentDate = parseISO(task.date);
  const tomorrowDate = addDays(currentDate, 1);
  const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');

  return {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: tomorrowStr,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Performance-optimized single-pass aggregator for 31-day month view task counts.
 */
export function getMonthlyTaskSummaries(
  yearMonth: string, // 'yyyy-MM'
  tasksRecord: Record<string, AgendaTask[]>
): Record<string, DayTaskSummary> {
  const summaries: Record<string, DayTaskSummary> = {};

  Object.keys(tasksRecord).forEach((dateKey) => {
    if (dateKey.startsWith(yearMonth)) {
      const taskList = tasksRecord[dateKey] || [];
      if (taskList.length > 0) {
        const completedCount = taskList.reduce((acc, t) => (t.completed ? acc + 1 : acc), 0);
        summaries[dateKey] = {
          total: taskList.length,
          completed: completedCount,
        };
      }
    }
  });

  return summaries;
}

/**
 * Schedules a local notification for a task with reminderTime.
 * Shifts by 1 minute if it collides with default 20:00 mood reminder.
 */
export async function scheduleTaskReminder(task: AgendaTask): Promise<void> {
  if (!task.reminderTime || task.completed) return;

  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return; // Fail silently if not granted

    const [hoursStr, minsStr] = task.reminderTime.split(':');
    let hours = parseInt(hoursStr, 10);
    let mins = parseInt(minsStr, 10);

    // Collision check: if 20:00 (default mood reminder time), shift task by 1 min to 20:01
    if (hours === 20 && mins === 0) {
      mins = 1;
    }

    const taskDate = parseISO(task.date);
    taskDate.setHours(hours, mins, 0, 0);

    // Only schedule if in the future
    if (taskDate.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.taskReminderTitle'),
          body: task.title,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: taskDate,
        },
      });
    }
  } catch {
    // Fail silently on notifications error
  }
}
