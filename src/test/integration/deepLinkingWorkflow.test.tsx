import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { db } from '@/core/db'
import { taskRepository } from '@/modules/tasks/repository/taskRepository'
import { habitRepository } from '@/modules/habits/repository/habitRepository'
import { TasksView } from '@/modules/tasks/components/TasksView'
import { HabitsView } from '@/modules/habits/HabitsView'
import {
  resetNotificationListenersSetupForTesting,
  setupNotificationListeners
} from '@/core/notifications/notificationService'

describe('Deep Linking and Action Routing Integration Workflow', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    await db.tasks.clear()
    await db.habits.clear()
    await db.projects.clear()
    await db.habitLogs.clear()
    window.location.hash = ''
    resetNotificationListenersSetupForTesting()
  })

  afterEach(async () => {
    window.location.hash = ''
    await db.tasks.clear()
    await db.habits.clear()
    await db.projects.clear()
    await db.habitLogs.clear()
    resetNotificationListenersSetupForTesting()
  })

  it('automatically opens task edit modal and highlights card when taskId is in route hash', async () => {
    const task = await taskRepository.createTask({
      title: 'Deep Link Test Task',
      priority: 'high',
      dueDate: '2026-08-16',
      status: 'todo'
    })

    window.location.hash = `#/tasks?taskId=${task.id}`

    render(
      <QueryClientProvider client={queryClient}>
        <TasksView />
      </QueryClientProvider>
    )

    // Verify modal is automatically opened with task details
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Deep Link Test Task')).toBeInTheDocument()
    })

    // Verify card DOM element has the deep link id
    const taskCard = document.getElementById(`task-card-${task.id}`)
    expect(taskCard).toBeInTheDocument()

    // Close the dialog and verify hash is reset
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(window.location.hash).toBe('#/tasks')
    })
  })

  it('automatically opens habit edit modal when habitId is in route hash', async () => {
    const habit = await habitRepository.createHabit({
      title: 'Morning Yoga Routine',
      categoryId: 'fitness',
      frequencyType: 'daily',
      targetDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      targetType: 'boolean',
      targetValue: 1,
      color: '#10B981',
      icon: 'Activity'
    })

    window.location.hash = `#/habits?habitId=${habit.id}`

    render(
      <QueryClientProvider client={queryClient}>
        <HabitsView />
      </QueryClientProvider>
    )

    // Verify modal is automatically opened with habit details
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Morning Yoga Routine')).toBeInTheDocument()
    })

    // Verify card DOM element has the deep link id
    await waitFor(() => {
      const habitCard = document.getElementById(`habit-card-${habit.id}`)
      expect(habitCard).toBeInTheDocument()
    })

    // Close the dialog and verify hash is reset
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(window.location.hash).toBe('#/habits')
    })
  })

  it('triggers hash navigation on notification click and Capacitor action listeners', async () => {
    const onNavigate = vi.fn()

    // Test Capacitor notification action listener
    const mockAddListener = vi.fn().mockImplementation((event, callback) => {
      if (event === 'localNotificationActionPerformed') {
        callback({
          notification: {
            extra: { taskId: 'deep-task-999' }
          }
        })
      }
      return { remove: vi.fn() }
    })

    const mockWindow = {
      location: { hash: '' },
      Capacitor: {
        isNativePlatform: () => true,
        Plugins: {
          LocalNotifications: {
            addListener: mockAddListener
          }
        }
      }
    }

    const previousWindow = (globalThis as unknown as { window?: unknown }).window
    ;(globalThis as unknown as { window: unknown }).window = mockWindow

    setupNotificationListeners(onNavigate)

    expect(onNavigate).toHaveBeenCalledWith('/tasks?taskId=deep-task-999')

    // Restore window
    ;(globalThis as unknown as { window?: unknown }).window = previousWindow
  })
})
