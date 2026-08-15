import { moduleRegistry } from '@/core/modules/registry'
import { HabitsView } from './habits/HabitsView'
import { HabitDashboardWidget } from './habits/components/HabitDashboardWidget'
import { TasksView } from './tasks/TasksView'
import { TaskDashboardWidget } from './tasks/components/TaskDashboardWidget'
import { NotesView } from './notes/NotesView'
import { SettingsView } from './settings/SettingsView'

export function initializeModules(): void {
  moduleRegistry.clear()

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
}
