import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendLocalNotification,
  scheduleHabitReminder,
  cancelHabitReminder,
  clearAllScheduledReminders
} from '../notificationService'

interface MockWindow {
  Notification?: unknown
  Capacitor?: unknown
}

describe('notificationService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllScheduledReminders()
    // Setup clean window on globalThis for browser simulation
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
            extra: undefined
          }
        ]
      })
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

      // Advance clock by 5s
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

      // Advance clock past the scheduled time
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
})
