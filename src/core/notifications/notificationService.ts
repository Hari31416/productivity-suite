import type { Task, TaskReminder } from '@/modules/tasks/types'
import type { Habit, HabitLog } from '@/modules/habits/types'
import { format, addDays } from 'date-fns'
import {
  isHabitScheduledOnDate,
  isHabitCompletedOnDate
} from '@/modules/habits/utils/streakCalculator'
import {
  generateSubdayIntervalSlots,
  getHabitSlots
} from '@/modules/habits/utils/intervalCalculator'
import { getDynamicStepConfig } from '@/modules/habits/utils/dynamicStepper'
import { db } from '@/core/db'

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported'

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
  targetType?: Habit['targetType']
  targetValue?: number
  unit?: string
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

export const HABIT_ACTION_TYPES = {
  BOOLEAN: 'HABIT_BOOLEAN_ACTION',
  NUMERIC: 'HABIT_NUMERIC_ACTION',
  TIMER: 'HABIT_TIMER_ACTION',
  INTERVAL: 'HABIT_INTERVAL_ACTION'
} as const

export interface CapacitorNotificationAction {
  notification?: {
    id?: number
    title?: string
    body?: string
    extra?: Record<string, unknown>
  }
  actionId?: string
  inputValue?: string
}

interface CapacitorLocalNotificationsPlugin {
  requestPermissions?: () => Promise<{ display: string }>
  checkPermissions?: () => Promise<{ display: string }>
  schedule?: (options: {
    notifications: Array<{
      title: string
      body?: string
      id: number
      schedule?: { at?: Date; allowWhileIdle?: boolean }
      extra?: Record<string, unknown>
      channelId?: string
      actionTypeId?: string
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
  registerActionTypes?: (options: {
    types: Array<{
      id: string
      actions?: Array<{
        id: string
        title: string
        requiresAuthentication?: boolean
        foreground?: boolean
        destructive?: boolean
        input?: boolean
      }>
    }>
  }) => Promise<void>
  addListener?: (
    eventName: 'localNotificationActionPerformed',
    listenerFunc: (action: CapacitorNotificationAction) => void
  ) => Promise<{ remove: () => void }> | { remove: () => void }
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
  if (capPlugin) {
    try {
      if (capPlugin.createChannel) {
        await capPlugin.createChannel({
          id: NOTIFICATION_CHANNEL_ID,
          name: 'Productivity Reminders',
          description: 'Alerts for tasks, habit intervals, and alarms with sound and vibration',
          importance: 5,
          visibility: 1,
          vibration: true,
          lights: true,
          lightColor: '#0A7A64'
        })
      }

      if (capPlugin.registerActionTypes) {
        await capPlugin.registerActionTypes({
          types: [
            {
              id: HABIT_ACTION_TYPES.BOOLEAN,
              actions: [
                { id: 'CHECK_IN_DONE', title: 'Check-In', foreground: true },
                { id: 'VIEW_HABIT', title: 'View Habit', foreground: true }
              ]
            },
            {
              id: HABIT_ACTION_TYPES.NUMERIC,
              actions: [
                { id: 'CHECK_IN_DONE', title: 'Mark Done', foreground: true },
                { id: 'CHECK_IN_PLUS_ONE', title: 'Log Progress', foreground: true },
                { id: 'VIEW_HABIT', title: 'View Habit', foreground: true }
              ]
            },
            {
              id: HABIT_ACTION_TYPES.TIMER,
              actions: [
                { id: 'START_TIMER', title: 'Start Timer', foreground: true },
                { id: 'CHECK_IN_DONE', title: 'Mark Done', foreground: true }
              ]
            },
            {
              id: HABIT_ACTION_TYPES.INTERVAL,
              actions: [
                { id: 'CHECK_IN_INTERVAL', title: 'Check-In Slot', foreground: true },
                { id: 'VIEW_HABIT', title: 'View Habit', foreground: true }
              ]
            }
          ]
        })
      }

      channelCreated = true
    } catch {
      // Channel or action registration failed or not supported
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

export function getNotificationTargetRoute(data?: Record<string, unknown>): string | null {
  if (!data) return null
  if (data.taskId) {
    return `/tasks?taskId=${data.taskId}`
  }
  if (data.habitId) {
    if (data.action === 'timer') {
      return `/habits?habitId=${data.habitId}&action=timer`
    }
    return `/habits?habitId=${data.habitId}`
  }
  if (typeof data.route === 'string' && data.route) {
    return data.route
  }
  return null
}

export async function executeHabitNotificationAction(
  actionId: string,
  extra?: Record<string, unknown>
): Promise<string | null> {
  if (!extra || !extra.habitId) return null
  const habitId = String(extra.habitId)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const now = new Date().toISOString()

  try {
    const habit = await db.habits.get(habitId)
    if (!habit || habit.archived) return null

    if (actionId === 'START_TIMER') {
      return `/habits?habitId=${habitId}&action=timer`
    }

    if (actionId === 'CHECK_IN_DONE' || actionId === 'CHECK_IN') {
      const intervalIndex =
        typeof extra.intervalIndex === 'number' ? extra.intervalIndex : undefined
      const logs = await db.habitLogs.where('[habitId+date]').equals([habitId, todayStr]).toArray()
      const existing = logs.find((l) =>
        intervalIndex !== undefined
          ? l.intervalIndex === intervalIndex
          : l.intervalIndex === undefined || l.intervalIndex === 0
      )

      if (existing) {
        await db.habitLogs.put({
          ...existing,
          completed: true,
          value: habit.targetValue || 1,
          updatedAt: now
        })
      } else {
        await db.habitLogs.add({
          id: crypto.randomUUID(),
          habitId,
          date: todayStr,
          timestamp: now,
          intervalIndex,
          completed: true,
          value: habit.targetValue || 1,
          createdAt: now,
          updatedAt: now
        })
      }

      await recalculateHabitReminders(habitId, todayStr)
      return `/habits?habitId=${habitId}`
    }

    if (actionId === 'CHECK_IN_PLUS_ONE' || actionId === 'CHECK_IN_STEP') {
      const targetVal = habit.targetValue || 1
      const stepDelta =
        typeof extra.stepValue === 'number' && extra.stepValue > 0
          ? extra.stepValue
          : getDynamicStepConfig(targetVal, habit.unit).primaryStep
      const logs = await db.habitLogs.where('[habitId+date]').equals([habitId, todayStr]).toArray()
      const existing = logs.find((l) => l.intervalIndex === undefined || l.intervalIndex === 0)
      const currentVal = existing?.value ?? (existing?.completed ? targetVal : 0)
      const nextVal = currentVal + stepDelta

      if (existing) {
        await db.habitLogs.put({
          ...existing,
          value: nextVal,
          completed: nextVal >= targetVal,
          updatedAt: now
        })
      } else {
        await db.habitLogs.add({
          id: crypto.randomUUID(),
          habitId,
          date: todayStr,
          timestamp: now,
          value: nextVal,
          completed: nextVal >= targetVal,
          createdAt: now,
          updatedAt: now
        })
      }

      await recalculateHabitReminders(habitId, todayStr)
      return `/habits?habitId=${habitId}`
    }

    if (actionId === 'CHECK_IN_INTERVAL') {
      const intervalIndex = typeof extra.intervalIndex === 'number' ? extra.intervalIndex : 0
      const logs = await db.habitLogs.where('[habitId+date]').equals([habitId, todayStr]).toArray()
      const existing = logs.find((l) => l.intervalIndex === intervalIndex)

      if (existing) {
        await db.habitLogs.put({
          ...existing,
          completed: true,
          updatedAt: now
        })
      } else {
        await db.habitLogs.add({
          id: crypto.randomUUID(),
          habitId,
          date: todayStr,
          timestamp: now,
          intervalIndex,
          completed: true,
          createdAt: now,
          updatedAt: now
        })
      }

      await recalculateHabitReminders(habitId, todayStr)
      return `/habits?habitId=${habitId}`
    }

    if (actionId === 'VIEW_HABIT' || actionId === 'tap') {
      return `/habits?habitId=${habitId}`
    }
  } catch {
    // Return fallback route on action execution failure
  }

  return `/habits?habitId=${habitId}`
}

let notificationListenersSetup = false

export function setupNotificationListeners(
  onNavigate?: (route: string) => void,
  queryClient?: { invalidateQueries: (options: { queryKey: readonly unknown[] }) => Promise<void> }
): (() => void) | void {
  if (typeof window === 'undefined') return
  const capPlugin = getCapacitorBridge()
  if (capPlugin && capPlugin.addListener && !notificationListenersSetup) {
    notificationListenersSetup = true
    try {
      const listenerHandle = capPlugin.addListener('localNotificationActionPerformed', (action) => {
        const actionId = action?.actionId || 'tap'
        const extra =
          (action?.notification?.extra as Record<string, unknown> | undefined) ||
          ((action?.notification as Record<string, unknown> | undefined)?.data as
            Record<string, unknown> | undefined) ||
          ((action as Record<string, unknown> | undefined)?.extra as
            Record<string, unknown> | undefined) ||
          {}

        if (extra?.habitId && actionId && actionId !== 'tap' && actionId !== 'VIEW_HABIT') {
          executeHabitNotificationAction(actionId, extra).then((targetRoute) => {
            if (queryClient) {
              queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
              queryClient.invalidateQueries({ queryKey: ['habits'] })
            }
            if (targetRoute) {
              if (onNavigate) {
                onNavigate(targetRoute)
              } else {
                window.location.hash = targetRoute
              }
            }
          })
        } else {
          const targetRoute = getNotificationTargetRoute(extra)
          if (queryClient) {
            queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
            queryClient.invalidateQueries({ queryKey: ['habits'] })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
          }
          if (targetRoute) {
            if (onNavigate) {
              onNavigate(targetRoute)
            } else {
              window.location.hash = targetRoute
            }
          }
        }
      })
      return () => {
        if (
          listenerHandle &&
          typeof (listenerHandle as Promise<{ remove: () => void }>).then === 'function'
        ) {
          ;(listenerHandle as Promise<{ remove: () => void }>).then((h) => h.remove?.())
        } else if (
          listenerHandle &&
          typeof (listenerHandle as { remove: () => void }).remove === 'function'
        ) {
          ;(listenerHandle as { remove: () => void }).remove()
        }
        notificationListenersSetup = false
      }
    } catch {
      // Listener registration failure fallback
    }
  }
}

export function resetNotificationListenersSetupForTesting(): void {
  notificationListenersSetup = false
}

export async function sendLocalNotification(payload: NotificationPayload): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const capPlugin = getCapacitorBridge()
  if (capPlugin && capPlugin.schedule) {
    try {
      await ensureNotificationChannel()
      const numericId =
        typeof payload.id === 'number' ? payload.id : Math.floor(Math.random() * 1000000)
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
    const notification = new window.Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/vite.svg',
      tag: payload.tag,
      data: payload.data
    })

    notification.onclick = () => {
      try {
        window.focus()
      } catch {
        // Window focus might not be permitted in all browser contexts
      }
      const targetRoute = getNotificationTargetRoute(payload.data)
      if (targetRoute) {
        window.location.hash = targetRoute
      }
      try {
        notification.close()
      } catch {
        // Ignore close error
      }
    }

    return true
  } catch {
    return false
  }
}

export function getHabitNotificationId(habitId: string, slotKey: string | number): number {
  let hash = 0
  const str = `habit_${habitId}_${slotKey}`
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash % 2000000000) + 1
}

export function getTaskNotificationId(taskId: string, reminderId: string | number): number {
  let hash = 0
  const str = `task_${taskId}_${reminderId}`
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash % 2000000000) + 1
}

export function getHabitActionTypeId(
  targetType?: Habit['targetType'],
  intervalIndex?: number
): string {
  if (intervalIndex !== undefined) {
    return HABIT_ACTION_TYPES.INTERVAL
  }
  if (targetType === 'numeric') {
    return HABIT_ACTION_TYPES.NUMERIC
  }
  if (targetType === 'timer') {
    return HABIT_ACTION_TYPES.TIMER
  }
  return HABIT_ACTION_TYPES.BOOLEAN
}

export async function scheduleHabitReminder(
  options: HabitReminderOptions
): Promise<number | string | null> {
  const reminderId =
    options.at && options.time
      ? getHabitNotificationId(
          options.habitId,
          `${options.at.toISOString().slice(0, 10)}_${options.time}`
        )
      : options.at && options.intervalIndex !== undefined
        ? getHabitNotificationId(
            options.habitId,
            `${options.at.toISOString().slice(0, 10)}_interval_${options.intervalIndex}`
          )
        : Math.floor(Date.now() % 1000000) +
          (options.intervalIndex !== undefined ? options.intervalIndex : 0)

  const stepConfig =
    options.targetType === 'numeric'
      ? getDynamicStepConfig(options.targetValue, options.unit)
      : null

  const title = options.habitTitle
  const body =
    options.body ||
    (options.intervalIndex !== undefined
      ? `Time for interval #${options.intervalIndex + 1} check-in.`
      : options.targetType === 'timer'
        ? `Ready for your ${options.targetValue || 15}-minute focus session?`
        : stepConfig && stepConfig.primaryStep > 1
          ? `Log progress (+${stepConfig.primaryStep} ${options.unit || ''}) toward daily goal.`
          : 'Ready for your daily check-in?')

  const actionTypeId = getHabitActionTypeId(options.targetType, options.intervalIndex)
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
            schedule: options.at ? { at: options.at, allowWhileIdle: true } : undefined,
            channelId: NOTIFICATION_CHANNEL_ID,
            actionTypeId,
            extra: {
              habitId: options.habitId,
              habitTitle: options.habitTitle,
              intervalIndex: options.intervalIndex,
              targetType: options.targetType,
              targetValue: options.targetValue,
              stepValue: stepConfig?.primaryStep,
              unit: options.unit,
              time: options.time
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
        data: {
          habitId: options.habitId,
          habitTitle: options.habitTitle,
          intervalIndex: options.intervalIndex,
          targetType: options.targetType,
          targetValue: options.targetValue,
          unit: options.unit
        }
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
    data: {
      habitId: options.habitId,
      habitTitle: options.habitTitle,
      intervalIndex: options.intervalIndex,
      targetType: options.targetType,
      targetValue: options.targetValue,
      unit: options.unit
    }
  })

  return sent ? reminderId : null
}

export function computeTaskReminderDate(
  reminder: TaskReminder,
  dueDate?: string,
  dueTime?: string,
  baseNow: Date = new Date()
): Date | null {
  if (reminder.type === 'exact' && reminder.exactDateTime) {
    const d = new Date(reminder.exactDateTime)
    return isNaN(d.getTime()) ? null : d
  }

  if (reminder.type === 'offset') {
    const todayStr = format(baseNow, 'yyyy-MM-dd')
    const effectiveDueDate = dueDate || todayStr
    const offsetMs = (reminder.offsetMinutes ?? 0) * 60 * 1000

    if (dueTime) {
      const timePart = dueTime.length === 5 ? `${dueTime}:00` : dueTime
      const fullIso = `${effectiveDueDate}T${timePart}`
      const baseDate = new Date(fullIso)
      if (isNaN(baseDate.getTime())) return null
      return new Date(baseDate.getTime() - offsetMs)
    }

    if (effectiveDueDate > todayStr) {
      const fullIso = `${effectiveDueDate}T09:00:00`
      const baseDate = new Date(fullIso)
      if (isNaN(baseDate.getTime())) return null
      return new Date(baseDate.getTime() - offsetMs)
    }

    const candidateSlots = ['09:00:00', '12:00:00', '15:00:00', '18:00:00', '21:00:00']
    for (const slot of candidateSlots) {
      const fullIso = `${effectiveDueDate}T${slot}`
      const candidateDate = new Date(new Date(fullIso).getTime() - offsetMs)
      if (candidateDate.getTime() > baseNow.getTime()) {
        return candidateDate
      }
    }

    const fallbackDelayMs = Math.max(5 * 60 * 1000, offsetMs || 15 * 60 * 1000)
    return new Date(baseNow.getTime() + fallbackDelayMs)
  }

  return null
}

export async function scheduleTaskReminder(options: TaskReminderOptions): Promise<number | null> {
  let targetDate = computeTaskReminderDate(options.reminder, options.dueDate, options.dueTime)

  if (targetDate && targetDate.getTime() <= Date.now()) {
    if (options.reminder.type === 'offset') {
      targetDate = new Date(Date.now() + 60 * 1000)
    } else {
      return null
    }
  }

  const reminderId =
    options.reminder.notificationId || getTaskNotificationId(options.taskId, options.reminder.id)

  const title = options.taskTitle
  const body = options.dueTime
    ? `Scheduled for ${options.dueDate || 'today'} at ${options.dueTime}`
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
      return null
    }

    const existingTimer = scheduledTimers.get(reminderId)
    if (existingTimer) {
      clearTimeout(existingTimer)
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

export async function cancelHabitReminder(notificationId: number | string): Promise<boolean> {
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

export async function cancelTaskReminder(notificationId: number | string): Promise<boolean> {
  return cancelHabitReminder(notificationId)
}

export async function rescheduleAllTaskReminders(tasks: Task[]): Promise<void> {
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

export async function scheduleHabitReminders(
  habit: Habit,
  options?: { logsForToday?: HabitLog[] }
): Promise<number[]> {
  if (habit.archived) return []
  const scheduledIds: number[] = []
  const now = new Date()
  const nowMs = now.getTime()
  const todayStr = format(now, 'yyyy-MM-dd')

  const todayLogs =
    options?.logsForToday ||
    (typeof window !== 'undefined'
      ? await db.habitLogs
          .where('[habitId+date]')
          .equals([habit.id, todayStr])
          .toArray()
          .catch(() => [])
      : [])

  const isTodayDone = isHabitCompletedOnDate(habit, todayLogs)

  // Schedule for the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDay = addDays(now, dayOffset)
    const dateStr = format(targetDay, 'yyyy-MM-dd')
    const isTargetToday = dateStr === todayStr

    if (!isHabitScheduledOnDate(habit, targetDay)) {
      continue
    }

    // If today's target is already completed early, suppress reminders for today
    if (isTargetToday && isTodayDone) {
      continue
    }

    // 1. Fixed reminder times (e.g., ["08:00", "20:00"])
    if (habit.reminderTimes && habit.reminderTimes.length > 0) {
      for (const timeStr of habit.reminderTimes) {
        const fullIso = `${dateStr}T${timeStr}:00`
        const targetDate = new Date(fullIso)
        if (!isNaN(targetDate.getTime()) && targetDate.getTime() > nowMs) {
          const id = getHabitNotificationId(habit.id, `${dateStr}_${timeStr}`)
          await scheduleHabitReminder({
            habitId: habit.id,
            habitTitle: habit.title,
            targetType: habit.targetType,
            targetValue: habit.targetValue,
            unit: habit.unit,
            time: timeStr,
            at: targetDate,
            body: `Time to complete your habit: ${habit.title}`
          })
          scheduledIds.push(id)
        }
      }
    }

    // 2. Subday interval slots
    if (habit.frequencyType === 'subday_interval') {
      const startTime = habit.timeWindow?.startTime || '08:00'
      const endTime = habit.timeWindow?.endTime || '20:00'
      const intervalHours = habit.intervalHours || 3
      const slots = generateSubdayIntervalSlots(startTime, endTime, intervalHours)

      for (const slot of slots) {
        // If checking today, verify if this specific slot is already checked in
        if (isTargetToday) {
          const slotLog = todayLogs.find((l) => l.intervalIndex === slot.index)
          if (slotLog?.completed) {
            continue
          }
        }

        const timeStr = slot.startTime || '09:00'
        const fullIso = `${dateStr}T${timeStr}:00`
        const targetDate = new Date(fullIso)
        if (!isNaN(targetDate.getTime()) && targetDate.getTime() > nowMs) {
          const id = getHabitNotificationId(habit.id, `${dateStr}_interval_${slot.index}`)
          await scheduleHabitReminder({
            habitId: habit.id,
            habitTitle: habit.title,
            targetType: habit.targetType,
            targetValue: habit.targetValue,
            unit: habit.unit,
            intervalIndex: slot.index,
            at: targetDate,
            body: `Time for interval #${slot.index + 1} check-in (${slot.label}) for: ${habit.title}`
          })
          scheduledIds.push(id)
        }
      }
    }
  }

  return scheduledIds
}

export async function cancelHabitReminders(habit: Habit | { id: string }): Promise<void> {
  const habitId = habit.id
  const now = new Date()

  // Cancel any potential IDs for the next 14 days
  for (let dayOffset = -1; dayOffset < 14; dayOffset++) {
    const targetDay = addDays(now, dayOffset)
    const dateStr = format(targetDay, 'yyyy-MM-dd')

    // Cancel possible reminder time slots
    if ('reminderTimes' in habit && Array.isArray(habit.reminderTimes)) {
      for (const timeStr of habit.reminderTimes) {
        const id = getHabitNotificationId(habitId, `${dateStr}_${timeStr}`)
        await cancelHabitReminder(id)
      }
    }
    // Cancel subday slots
    for (let slotIndex = 0; slotIndex < 24; slotIndex++) {
      const id = getHabitNotificationId(habitId, `${dateStr}_interval_${slotIndex}`)
      await cancelHabitReminder(id)
    }
  }
}

export async function recalculateHabitReminders(
  habitId: string,
  targetDateStr?: string
): Promise<void> {
  try {
    const habit = await db.habits.get(habitId)
    if (!habit || habit.archived) {
      await cancelHabitReminders({ id: habitId })
      return
    }

    const todayStr = targetDateStr || format(new Date(), 'yyyy-MM-dd')
    const logs = await db.habitLogs.where('[habitId+date]').equals([habitId, todayStr]).toArray()
    const isCompleted = isHabitCompletedOnDate(habit, logs)

    if (isCompleted) {
      // Habit is finished early today: cancel today's reminders
      if (habit.reminderTimes && Array.isArray(habit.reminderTimes)) {
        for (const timeStr of habit.reminderTimes) {
          const id = getHabitNotificationId(habit.id, `${todayStr}_${timeStr}`)
          await cancelHabitReminder(id)
        }
      }
      for (let slotIndex = 0; slotIndex < 24; slotIndex++) {
        const id = getHabitNotificationId(habit.id, `${todayStr}_interval_${slotIndex}`)
        await cancelHabitReminder(id)
      }
    } else {
      // Habit is still in progress: cancel only completed interval slots
      if (habit.frequencyType === 'subday_interval') {
        const slots = getHabitSlots(habit)
        for (const slot of slots) {
          const slotLog = logs.find((l) => l.intervalIndex === slot.index)
          if (slotLog?.completed) {
            const id = getHabitNotificationId(habit.id, `${todayStr}_interval_${slot.index}`)
            await cancelHabitReminder(id)
          }
        }
      }
    }
  } catch {
    // Non-fatal error during notification recalculation
  }
}

export async function rescheduleAllHabitReminders(habits: Habit[]): Promise<void> {
  for (const habit of habits) {
    if (habit.archived) continue
    await scheduleHabitReminders(habit)
  }
}

export function clearAllScheduledReminders(): void {
  for (const timer of scheduledTimers.values()) {
    clearTimeout(timer)
  }
  scheduledTimers.clear()
}
