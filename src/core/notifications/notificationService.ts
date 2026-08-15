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
    }>
  }) => Promise<unknown>
  cancel?: (options: { notifications: Array<{ id: number }> }) => Promise<unknown>
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
    // Capacitor permission state defaults to granted if plugin is active
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
            extra: payload.data
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
      await capPlugin.schedule({
        notifications: [
          {
            id: reminderId,
            title,
            body,
            schedule: options.at ? { at: options.at } : undefined,
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

export function clearAllScheduledReminders(): void {
  for (const timer of scheduledTimers.values()) {
    clearTimeout(timer)
  }
  scheduledTimers.clear()
}
