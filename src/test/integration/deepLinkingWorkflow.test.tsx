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

  it('automatically opens dedicated task detail workspace when taskId is in route hash', async () => {
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

    // Verify dedicated Task Details View is rendered with hero header, focus timer, subtasks
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Deep Link Test Task' })
      ).toBeInTheDocument()
      expect(screen.getByText('Task Focus Timer')).toBeInTheDocument()
      expect(screen.getByText('Subtasks Checklist')).toBeInTheDocument()
    })

    // Click back button and verify hash is reset
    const backBtn = screen.getByRole('button', { name: /back to tasks/i })
    fireEvent.click(backBtn)

    await waitFor(() => {
      expect(window.location.hash).toBe('#/tasks')
    })
  })

  it('automatically opens dedicated habit detail view when habitId is in route hash', async () => {
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

    // Verify dedicated Habit Details View is rendered
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Morning Yoga Routine' })
      ).toBeInTheDocument()
      expect(screen.getByText('Current Streak')).toBeInTheDocument()
      expect(screen.getByText('Best Streak')).toBeInTheDocument()
    })

    // Click back button and verify hash returns to #/habits
    const backBtn = screen.getByRole('button', { name: /back to habits/i })
    fireEvent.click(backBtn)

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
