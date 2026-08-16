import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendLocalNotification,
  scheduleHabitReminder,
  cancelHabitReminder,
  computeTaskReminderDate,
  scheduleTaskReminder,
  cancelTaskReminder,
  clearAllScheduledReminders,
  getNotificationTargetRoute,
  setupNotificationListeners,
  resetNotificationListenersSetupForTesting
} from '../notificationService'

interface MockWindow {
  Notification?: unknown
  Capacitor?: unknown
  location?: { hash: string }
  focus?: () => void
}

describe('notificationService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllScheduledReminders()
    ;(globalThis as unknown as { window: MockWindow }).window = {}
  })

  afterEach(() => {
    vi.useRealTimers()
    clearAllScheduledReminders()
    delete (globalThis as unknown as { window?: unknown }).window
  })

  describe('isNotificationSupported', () => {
    it('returns false when window is undefined', () => {
      delete (globalThis as unknown as { window?: unknown }).window
      expect(isNotificationSupported()).toBe(false)
    })

    it('returns false when Notification is not in window and Capacitor is absent', () => {
      ;(globalThis as unknown as { window: MockWindow }).window = {}
      expect(isNotificationSupported()).toBe(false)
    })

    it('returns true when Notification is in window', () => {
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: {
          permission: 'default',
          requestPermission: vi.fn()
        }
      }
      expect(isNotificationSupported()).toBe(true)
    })

    it('returns true when Capacitor native platform is detected', () => {
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Capacitor: {
          isNativePlatform: () => true,
          Plugins: {
            LocalNotifications: {
              schedule: vi.fn(),
              requestPermissions: vi.fn()
            }
          }
        }
      }
      expect(isNotificationSupported()).toBe(true)
    })
  })

  describe('getNotificationPermission', () => {
    it('returns unsupported when window is undefined or Notification is absent', () => {
      delete (globalThis as unknown as { window?: unknown }).window
      expect(getNotificationPermission()).toBe('unsupported')

      ;(globalThis as unknown as { window: MockWindow }).window = {}
      expect(getNotificationPermission()).toBe('unsupported')
    })

    it('returns permission status from window.Notification', () => {
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: {
          permission: 'granted',
          requestPermission: vi.fn()
        }
      }
      expect(getNotificationPermission()).toBe('granted')

      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: {
          permission: 'denied',
          requestPermission: vi.fn()
        }
      }
      expect(getNotificationPermission()).toBe('denied')

      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: {
          permission: 'default',
          requestPermission: vi.fn()
        }
      }
      expect(getNotificationPermission()).toBe('default')
    })

    it('returns granted when Capacitor LocalNotifications plugin is detected', () => {
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Capacitor: {
          isNativePlatform: () => true,
          Plugins: {
            LocalNotifications: {}
          }
        }
      }
      expect(getNotificationPermission()).toBe('granted')
    })
  })

  describe('requestNotificationPermission', () => {
    it('returns unsupported when Notification is not in window', async () => {
      ;(globalThis as unknown as { window: MockWindow }).window = {}
      const result = await requestNotificationPermission()
      expect(result).toBe('unsupported')
    })

    it('requests permission and returns granted when user permits', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted')
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: {
          permission: 'default',
          requestPermission: mockRequestPermission
        }
      }

      const result = await requestNotificationPermission()
      expect(mockRequestPermission).toHaveBeenCalled()
      expect(result).toBe('granted')
    })

    it('requests permission and returns denied when user blocks', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied')
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: {
          permission: 'default',
          requestPermission: mockRequestPermission
        }
      }

      const result = await requestNotificationPermission()
      expect(mockRequestPermission).toHaveBeenCalled()
      expect(result).toBe('denied')
    })

    it('handles Capacitor plugin requestPermissions', async () => {
      const mockPluginRequest = vi.fn().mockResolvedValue({ display: 'granted' })
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Capacitor: {
          isNativePlatform: () => true,
          Plugins: {
            LocalNotifications: {
              requestPermissions: mockPluginRequest
            }
          }
        }
      }

      const result = await requestNotificationPermission()
      expect(mockPluginRequest).toHaveBeenCalled()
      expect(result).toBe('granted')
    })
  })

  describe('sendLocalNotification', () => {
    it('returns false when notifications are not supported', async () => {
      ;(globalThis as unknown as { window: MockWindow }).window = {}
      const sent = await sendLocalNotification({ title: 'Test Title' })
      expect(sent).toBe(false)
    })

    it('instantiates Notification when permission is granted', async () => {
      const mockNotificationConstructor = vi.fn()
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: Object.assign(mockNotificationConstructor, {
          permission: 'granted',
          requestPermission: vi.fn()
        })
      }

      const sent = await sendLocalNotification({
        title: 'Drink Water',
        body: 'Time for hydration interval',
        tag: 'habit-1'
      })

      expect(sent).toBe(true)
      expect(mockNotificationConstructor).toHaveBeenCalledWith('Drink Water', {
        body: 'Time for hydration interval',
        icon: '/vite.svg',
        tag: 'habit-1',
        data: undefined
      })
    })

    it('requests permission and sends notification if initially default', async () => {
      const mockNotificationConstructor = vi.fn()
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: Object.assign(mockNotificationConstructor, {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('granted')
        })
      }

      const sent = await sendLocalNotification({ title: 'Exercise' })
      expect(sent).toBe(true)
      expect(mockNotificationConstructor).toHaveBeenCalled()
    })

    it('wires onclick handler to trigger hash navigation for taskId or habitId', async () => {
      let createdNotificationInstance: { onclick?: () => void; close?: () => void } | null = null
      const mockClose = vi.fn()
      const mockFocus = vi.fn()

      const mockNotificationConstructor = vi.fn().mockImplementation(function (
        this: { onclick?: () => void; close?: () => void }
      ) {
        this.close = mockClose
        createdNotificationInstance = this
        return this
      })

      ;(globalThis as unknown as { window: MockWindow }).window = {
        location: { hash: '' },
        focus: mockFocus,
        Notification: Object.assign(mockNotificationConstructor, {
          permission: 'granted',
          requestPermission: vi.fn()
        })
      }

      await sendLocalNotification({
        title: 'Task Reminder',
        data: { taskId: 't-123' }
      })

      expect(createdNotificationInstance).not.toBeNull()
      if (createdNotificationInstance) {
        ;(createdNotificationInstance as { onclick?: () => void }).onclick?.()
        expect(
          (globalThis as unknown as { window: { location: { hash: string } } })
            .window.location.hash
        ).toBe('/tasks?taskId=t-123')
        expect(mockFocus).toHaveBeenCalled()
        expect(mockClose).toHaveBeenCalled()
      }
    })

    it('schedules notification via Capacitor when running native', async () => {
      const mockSchedule = vi.fn().mockResolvedValue({})
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Capacitor: {
          isNativePlatform: () => true,
          Plugins: {
            LocalNotifications: {
              schedule: mockSchedule
            }
          }
        }
      }

      const sent = await sendLocalNotification({
        id: 42,
        title: 'Meditation',
        body: 'Time for mindful minutes'
      })

      expect(sent).toBe(true)
      expect(mockSchedule).toHaveBeenCalledWith({
        notifications: [
          {
            id: 42,
            title: 'Meditation',
            body: 'Time for mindful minutes',
            extra: undefined,
            channelId: 'productivity-reminders'
          }
        ]
      })
    })
  })

  describe('getNotificationTargetRoute', () => {
    it('resolves correct route for taskId, habitId, or custom route', () => {
      expect(getNotificationTargetRoute()).toBeNull()
      expect(getNotificationTargetRoute({})).toBeNull()
      expect(getNotificationTargetRoute({ taskId: 'task-10' })).toBe(
        '/tasks?taskId=task-10'
      )
      expect(getNotificationTargetRoute({ habitId: 'habit-20' })).toBe(
        '/habits?habitId=habit-20'
      )
      expect(getNotificationTargetRoute({ route: '/notes?noteId=note-30' })).toBe(
        '/notes?noteId=note-30'
      )
    })
  })

  describe('setupNotificationListeners', () => {
    it('registers Capacitor localNotificationActionPerformed listener and navigates', () => {
      resetNotificationListenersSetupForTesting()
      let registeredListener: ((action: unknown) => void) | null = null
      const mockRemove = vi.fn()
      const mockAddListener = vi.fn().mockImplementation((event, listener) => {
        if (event === 'localNotificationActionPerformed') {
          registeredListener = listener
        }
        return { remove: mockRemove }
      })

      const onNavigate = vi.fn()

      ;(globalThis as unknown as { window: MockWindow }).window = {
        Capacitor: {
          isNativePlatform: () => true,
          Plugins: {
            LocalNotifications: {
              addListener: mockAddListener
            }
          }
        }
      }

      const cleanup = setupNotificationListeners(onNavigate)
      expect(mockAddListener).toHaveBeenCalledWith(
        'localNotificationActionPerformed',
        expect.any(Function)
      )

      expect(registeredListener).not.toBeNull()
      if (registeredListener) {
        ;(registeredListener as (action: unknown) => void)({
          notification: {
            extra: { habitId: 'h-99' }
          }
        })
        expect(onNavigate).toHaveBeenCalledWith('/habits?habitId=h-99')
      }

      if (typeof cleanup === 'function') {
        cleanup()
        expect(mockRemove).toHaveBeenCalled()
      }
    })
  })

  describe('scheduleHabitReminder and cancelHabitReminder', () => {
    it('schedules immediate reminder when no future date is given', async () => {
      const mockNotificationConstructor = vi.fn()
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: Object.assign(mockNotificationConstructor, {
          permission: 'granted',
          requestPermission: vi.fn()
        })
      }

      const id = await scheduleHabitReminder({
        habitId: 'h-1',
        habitTitle: 'Read Book',
        intervalIndex: 2
      })

      expect(id).toBeDefined()
      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Habit Reminder: Read Book',
        expect.objectContaining({
          body: 'Time for interval #3 check-in.'
        })
      )
    })

    it('schedules future reminder and triggers when time elapses', async () => {
      const mockNotificationConstructor = vi.fn()
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: Object.assign(mockNotificationConstructor, {
          permission: 'granted',
          requestPermission: vi.fn()
        })
      }

      const targetDate = new Date(Date.now() + 5000)
      const id = await scheduleHabitReminder({
        habitId: 'h-1',
        habitTitle: 'Stretch',
        at: targetDate
      })

      expect(id).toBeDefined()
      expect(mockNotificationConstructor).not.toHaveBeenCalled()

      vi.advanceTimersByTime(5000)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Habit Reminder: Stretch',
        expect.objectContaining({
          body: 'Time to complete your habit: Stretch'
        })
      )
    })

    it('cancels scheduled reminder before it fires', async () => {
      const mockNotificationConstructor = vi.fn()
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: Object.assign(mockNotificationConstructor, {
          permission: 'granted',
          requestPermission: vi.fn()
        })
      }

      const targetDate = new Date(Date.now() + 5000)
      const id = await scheduleHabitReminder({
        habitId: 'h-1',
        habitTitle: 'Stretch',
        at: targetDate
      })

      expect(id).toBeDefined()
      if (id) {
        const cancelled = await cancelHabitReminder(id)
        expect(cancelled).toBe(true)
      }

      vi.advanceTimersByTime(6000)
      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })

    it('cancels scheduled reminder via Capacitor when native', async () => {
      const mockCancel = vi.fn().mockResolvedValue({})
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Capacitor: {
          isNativePlatform: () => true,
          Plugins: {
            LocalNotifications: {
              cancel: mockCancel
            }
          }
        }
      }

      const cancelled = await cancelHabitReminder(123)
      expect(cancelled).toBe(true)
      expect(mockCancel).toHaveBeenCalledWith({
        notifications: [{ id: 123 }]
      })
    })
  })

  describe('Task Reminders', () => {
    it('computes offset and exact reminder dates correctly', () => {
      const offsetDate = computeTaskReminderDate(
        { id: 'r1', type: 'offset', offsetMinutes: 15 },
        '2026-08-16',
        '10:00'
      )
      expect(offsetDate).toBeDefined()
      // 10:00 minus 15 min = 09:45
      expect(offsetDate?.getHours()).toBe(9)
      expect(offsetDate?.getMinutes()).toBe(45)

      const exactDate = computeTaskReminderDate(
        { id: 'r2', type: 'exact', exactDateTime: '2026-08-16T14:30:00' }
      )
      expect(exactDate).toBeDefined()
      expect(exactDate?.getHours()).toBe(14)
      expect(exactDate?.getMinutes()).toBe(30)
    })

    it('schedules and triggers task reminders on web timer', async () => {
      const mockNotificationConstructor = vi.fn()
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: Object.assign(mockNotificationConstructor, {
          permission: 'granted',
          requestPermission: vi.fn()
        })
      }

      const futureTime = new Date(Date.now() + 10000).toISOString()
      const reminderId = await scheduleTaskReminder({
        taskId: 't-1',
        taskTitle: 'Team Sync',
        reminder: { id: 'r-1', type: 'exact', exactDateTime: futureTime }
      })

      expect(reminderId).toBeDefined()
      expect(mockNotificationConstructor).not.toHaveBeenCalled()

      vi.advanceTimersByTime(10000)

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        'Task Reminder: Team Sync',
        expect.anything()
      )
    })

    it('cancels scheduled task reminder', async () => {
      const mockNotificationConstructor = vi.fn()
      ;(globalThis as unknown as { window: MockWindow }).window = {
        Notification: Object.assign(mockNotificationConstructor, {
          permission: 'granted',
          requestPermission: vi.fn()
        })
      }

      const futureTime = new Date(Date.now() + 10000).toISOString()
      const reminderId = await scheduleTaskReminder({
        taskId: 't-2',
        taskTitle: 'Deploy Build',
        reminder: { id: 'r-2', type: 'exact', exactDateTime: futureTime }
      })

      if (reminderId) {
        const cancelled = await cancelTaskReminder(reminderId)
        expect(cancelled).toBe(true)
      }

      vi.advanceTimersByTime(12000)
      expect(mockNotificationConstructor).not.toHaveBeenCalled()
    })
  })
})
