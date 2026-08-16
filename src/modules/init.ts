import type { QueryClient } from '@tanstack/react-query'
import { moduleRegistry } from '@/core/modules/registry'
import { DashboardView } from './dashboard/DashboardView'
import { HabitsView } from './habits/HabitsView'
import { HabitDashboardWidget } from './habits/components/HabitDashboardWidget'
import { TasksView } from './tasks/TasksView'
import { TaskDashboardWidget } from './tasks/components/TaskDashboardWidget'
import { NotesView } from './notes/NotesView'
import { NotesDashboardWidget } from './notes/components/NotesDashboardWidget'
import { SettingsView } from './settings/SettingsView'
import { taskRepository } from './tasks/repository/taskRepository'
import { habitRepository } from './habits/repository/habitRepository'
import {
  rescheduleAllTaskReminders,
  rescheduleAllHabitReminders,
  clearAllScheduledReminders,
  sendLocalNotification
} from '@/core/notifications/notificationService'
import { db } from '@/core/db'
import { ensureDatabaseSeeded } from '@/core/db/seed'

export function initializeModules(queryClient?: QueryClient): void {
  moduleRegistry.clear()

  moduleRegistry.register({
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Unified home overview and daily score',
    iconName: 'LayoutDashboard',
    route: '/',
    navOrder: 0,
    routes: [
      {
        path: '/',
        component: DashboardView,
        exact: true
      }
    ]
  })

  moduleRegistry.register({
    id: 'habits',
    title: 'Habits',
    description: 'Track daily habits and streaks',
    iconName: 'Activity',
    route: '/habits',
    navOrder: 1,
    dashboardWidget: HabitDashboardWidget,
    routes: [
      {
        path: '/habits',
        component: HabitsView,
        exact: true
      }
    ]
  })

  moduleRegistry.register({
    id: 'tasks',
    title: 'Tasks',
    description: 'Manage tasks and projects',
    iconName: 'CheckSquare',
    route: '/tasks',
    navOrder: 2,
    dashboardWidget: TaskDashboardWidget,
    routes: [
      {
        path: '/tasks',
        component: TasksView,
        exact: true
      }
    ]
  })

  moduleRegistry.register({
    id: 'notes',
    title: 'Notes',
    description: 'Markdown notepad and search',
    iconName: 'FileText',
    route: '/notes',
    navOrder: 3,
    dashboardWidget: NotesDashboardWidget,
    routes: [
      {
        path: '/notes',
        component: NotesView,
        exact: true
      }
    ]
  })

  moduleRegistry.register({
    id: 'settings',
    title: 'Settings',
    description: 'App preferences and database storage',
    iconName: 'Settings',
    route: '/settings',
    navOrder: 4,
    routes: [
      {
        path: '/settings',
        component: SettingsView,
        exact: true
      }
    ]
  })

  // Background initialization of database seeding, recurring tasks, and task reminders
  if (typeof window !== 'undefined') {
    ;(
      window as unknown as { sendLocalNotification?: typeof sendLocalNotification }
    ).sendLocalNotification = sendLocalNotification

    ensureDatabaseSeeded(db)
      .then((didSeed) => {
        if (didSeed && queryClient) {
          queryClient.invalidateQueries()
        }
      })
      .then(() => {
        clearAllScheduledReminders()
        return taskRepository.syncRecurringInstances(30)
      })
      .then(() => taskRepository.getAllTasks({ includeArchived: false }))
      .then((tasks) => rescheduleAllTaskReminders(tasks))
      .then(() => habitRepository.getAllHabits(false))
      .then((habits) => rescheduleAllHabitReminders(habits))
      .catch(() => {
        // Silently continue if initial background sync encounters an issue
      })
  }
}
