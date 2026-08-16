import type { Task, TaskReminder } from '@/modules/tasks/types'

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'

export interface NotificationPayload {
  id?: number | string
  title: string
  body?: string
  icon?: string
  tag?: string
  data?: Record<string, unknown>
}

export interface HabitReminderOptions {
  habitId: string
  habitTitle: string
  time?: string
  intervalIndex?: number
  body?: string
  at?: Date
}

export interface TaskReminderOptions {
  taskId: string
  taskTitle: string
  dueDate?: string
  dueTime?: string
  reminder: TaskReminder
}

export const NOTIFICATION_CHANNEL_ID = 'productivity-reminders'

interface CapacitorLocalNotificationsPlugin {
  requestPermissions?: () => Promise<{ display: string }>
  checkPermissions?: () => Promise<{ display: string }>
  schedule?: (options: {
    notifications: Array<{
      title: string
      body?: string
      id: number
      schedule?: { at?: Date }
      extra?: Record<string, unknown>
      channelId?: string
      sound?: string
      smallIcon?: string
      iconColor?: string
      largeIcon?: string
    }>
  }) => Promise<unknown>
  cancel?: (options: { notifications: Array<{ id: number }> }) => Promise<unknown>
  createChannel?: (channel: {
    id: string
    name: string
    description?: string
    importance?: number
    visibility?: number
    sound?: string
    vibration?: boolean
    lights?: boolean
    lightColor?: string
  }) => Promise<void>
}

interface WindowWithCapacitor {
  Capacitor?: {
    isNativePlatform?: () => boolean
    Plugins?: {
      LocalNotifications?: CapacitorLocalNotificationsPlugin
    }
  }
}

// In-memory active timer IDs for web scheduled notifications
const scheduledTimers = new Map<number | string, ReturnType<typeof setTimeout>>()
let channelCreated = false

export async function ensureNotificationChannel(): Promise<void> {
  if (channelCreated) return
  const capPlugin = getCapacitorBridge()
  if (capPlugin && capPlugin.createChannel) {
    try {
      await capPlugin.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: 'Productivity Reminders',
        description: 'Alerts for tasks, habit intervals, and alarms with sound and vibration',
        importance: 5,
        visibility: 1,
        sound: 'beep.wav',
        vibration: true,
        lights: true,
        lightColor: '#0A7A64'
      })
      channelCreated = true
    } catch {
      // Channel creation failed or not supported
    }
  }
}

function getCapacitorBridge(): CapacitorLocalNotificationsPlugin | null {
  if (typeof window === 'undefined') return null
  const win = window as unknown as WindowWithCapacitor
  if (win.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform()) {
    return win.Capacitor.Plugins?.LocalNotifications ?? null
  }
  return null
}

export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (getCapacitorBridge() !== null) return true
  return 'Notification' in window
}

export function getNotificationPermission(): NotificationPermissionStatus {
  if (typeof window === 'undefined') return 'unsupported'

  const capPlugin = getCapacitorBridge()
  if (capPlugin) {
    return 'granted'
  }

  if (!('Notification' in window)) {
    return 'unsupported'
  }

  return window.Notification.permission as NotificationPermissionStatus
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined') return 'unsupported'

  const capPlugin = getCapacitorBridge()
  if (capPlugin && capPlugin.requestPermissions) {
    try {
      await ensureNotificationChannel()
      const result = await capPlugin.requestPermissions()
      if (result.display === 'granted') return 'granted'
      if (result.display === 'denied') return 'denied'
      return 'default'
    } catch {
      return 'denied'
    }
  }

  if (!('Notification' in window)) {
    return 'unsupported'
  }

  try {
    const permission = await window.Notification.requestPermission()
    return permission as NotificationPermissionStatus
  } catch {
    return 'denied'
  }
}

export async function sendLocalNotification(
  payload: NotificationPayload
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const capPlugin = getCapacitorBridge()
  if (capPlugin && capPlugin.schedule) {
    try {
      await ensureNotificationChannel()
      const numericId =
        typeof payload.id === 'number'
          ? payload.id
          : Math.floor(Math.random() * 1000000)
      await capPlugin.schedule({
        notifications: [
          {
            id: numericId,
            title: payload.title,
            body: payload.body,
            extra: payload.data,
            channelId: NOTIFICATION_CHANNEL_ID
          }
        ]
      })
      return true
    } catch {
      return false
    }
  }

  if (!('Notification' in window)) {
    return false
  }

  if (window.Notification.permission !== 'granted') {
    const status = await requestNotificationPermission()
    if (status !== 'granted') return false
  }

  try {
    new window.Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/vite.svg',
      tag: payload.tag,
      data: payload.data
    })
    return true
  } catch {
    return false
  }
}

export async function scheduleHabitReminder(
  options: HabitReminderOptions
): Promise<number | string | null> {
  const reminderId =
    Math.floor(Date.now() % 1000000) +
    (options.intervalIndex !== undefined ? options.intervalIndex : 0)

  const title = `Habit Reminder: ${options.habitTitle}`
  const body =
    options.body ||
    (options.intervalIndex !== undefined
      ? `Time for interval #${options.intervalIndex + 1} check-in.`
      : `Time to complete your habit: ${options.habitTitle}`)

  const capPlugin = getCapacitorBridge()
  if (capPlugin && capPlugin.schedule) {
    try {
      await ensureNotificationChannel()
      await capPlugin.schedule({
        notifications: [
          {
            id: reminderId,
            title,
            body,
            schedule: options.at ? { at: options.at } : undefined,
            channelId: NOTIFICATION_CHANNEL_ID,
            extra: {
              habitId: options.habitId,
              intervalIndex: options.intervalIndex
            }
          }
        ]
      })
      return reminderId
    } catch {
      return null
    }
  }

  if (!isNotificationSupported()) {
    return null
  }

  // If specific future time is provided for web
  if (options.at) {
    const delayMs = Math.max(0, options.at.getTime() - Date.now())
    const timer = setTimeout(() => {
      sendLocalNotification({
        id: reminderId,
        title,
        body,
        data: { habitId: options.habitId, intervalIndex: options.intervalIndex }
      })
      scheduledTimers.delete(reminderId)
    }, delayMs)

    scheduledTimers.set(reminderId, timer)
    return reminderId
  }

  // Trigger immediate reminder if no target date specified
  const sent = await sendLocalNotification({
    id: reminderId,
    title,
    body,
    data: { habitId: options.habitId, intervalIndex: options.intervalIndex }
  })

  return sent ? reminderId : null
}

export function computeTaskReminderDate(
  reminder: TaskReminder,
  dueDate?: string,
  dueTime?: string
): Date | null {
  if (reminder.type === 'exact' && reminder.exactDateTime) {
    const d = new Date(reminder.exactDateTime)
    return isNaN(d.getTime()) ? null : d
  }

  if (reminder.type === 'offset' && dueDate) {
    const timeStr = dueTime ? `${dueTime}:00` : '09:00:00'
    const fullIso = `${dueDate}T${timeStr}`
    const baseDate = new Date(fullIso)
    if (isNaN(baseDate.getTime())) return null

    const offsetMs = (reminder.offsetMinutes ?? 0) * 60 * 1000
    return new Date(baseDate.getTime() - offsetMs)
  }

  return null
}

export async function scheduleTaskReminder(
  options: TaskReminderOptions
): Promise<number | null> {
  const targetDate = computeTaskReminderDate(
    options.reminder,
    options.dueDate,
    options.dueTime
  )

  const reminderId =
    options.reminder.notificationId ||
    Math.floor(Date.now() % 1000000) + Math.floor(Math.random() * 1000)

  const title = `Task Reminder: ${options.taskTitle}`
  const body = options.dueTime
    ? `Scheduled for ${options.dueDate} at ${options.dueTime}`
    : `Due on ${options.dueDate || 'today'}`

  const capPlugin = getCapacitorBridge()
  if (capPlugin && capPlugin.schedule) {
    try {
      await ensureNotificationChannel()
      await capPlugin.schedule({
        notifications: [
          {
            id: reminderId,
            title,
            body,
            schedule: targetDate ? { at: targetDate } : undefined,
            channelId: NOTIFICATION_CHANNEL_ID,
            extra: {
              taskId: options.taskId,
              reminderId: options.reminder.id
            }
          }
        ]
      })
      return reminderId
    } catch {
      return null
    }
  }

  if (!isNotificationSupported()) {
    return null
  }

  if (targetDate) {
    const delayMs = targetDate.getTime() - Date.now()
    if (delayMs <= 0) {
      return null // Already in past
    }

    const timer = setTimeout(() => {
      sendLocalNotification({
        id: reminderId,
        title,
        body,
        data: { taskId: options.taskId, reminderId: options.reminder.id }
      })
      scheduledTimers.delete(reminderId)
    }, delayMs)

    scheduledTimers.set(reminderId, timer)
    return reminderId
  }

  return null
}

export async function cancelHabitReminder(
  notificationId: number | string
): Promise<boolean> {
  const capPlugin = getCapacitorBridge()
  if (capPlugin && capPlugin.cancel && typeof notificationId === 'number') {
    try {
      await capPlugin.cancel({ notifications: [{ id: notificationId }] })
      return true
    } catch {
      return false
    }
  }

  const existingTimer = scheduledTimers.get(notificationId)
  if (existingTimer) {
    clearTimeout(existingTimer)
    scheduledTimers.delete(notificationId)
    return true
  }

  return true
}

export async function cancelTaskReminder(
  notificationId: number | string
): Promise<boolean> {
  return cancelHabitReminder(notificationId)
}

export async function rescheduleAllTaskReminders(tasks: Task[]): Promise<void> {
  clearAllScheduledReminders()
  const now = Date.now()

  for (const task of tasks) {
    if (task.status === 'done' || task.archived || !task.reminders) {
      continue
    }

    for (const reminder of task.reminders) {
      const targetDate = computeTaskReminderDate(reminder, task.dueDate, task.dueTime)
      if (targetDate && targetDate.getTime() > now) {
        await scheduleTaskReminder({
          taskId: task.id,
          taskTitle: task.title,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          reminder
        })
      }
    }
  }
}

export function clearAllScheduledReminders(): void {
  for (const timer of scheduledTimers.values()) {
    clearTimeout(timer)
  }
  scheduledTimers.clear()
}
