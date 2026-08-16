import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { moduleRegistry } from '@/core/modules/registry'
import { initializeModules } from '@/modules/init'
import { useHashRoute } from '@/core/router/hashRouter'
import { setupNotificationListeners } from '@/core/notifications/notificationService'
import { setupBackButton } from '@/core/platform/backButton'
import { AppShell } from '@/components/layout/AppShell'
import { CommandPalette } from '@/components/command/CommandPalette'
import { QuickAddSheet } from '@/components/layout/QuickAddSheet'
import { HabitFormModal } from '@/modules/habits/components/HabitFormModal'
import { TaskFormModal } from '@/modules/tasks/components/TaskFormModal'
import { NoteFormModal } from '@/modules/notes/components/NoteFormModal'
import { StartupModal } from '@/components/onboarding/StartupModal'
import { useUserProfile } from '@/core/profile/useUserProfile'
import { getGreeting } from '@/modules/dashboard/utils/dashboardScore'
import { useQueryClient } from '@tanstack/react-query'

export function App() {
  const queryClient = useQueryClient()
  const { pathname, navigate } = useHashRoute()

  const { userName } = useUserProfile()

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [quickAddSheetOpen, setQuickAddSheetOpen] = useState(false)
  const [quickTaskModalOpen, setQuickTaskModalOpen] = useState(false)
  const [quickHabitModalOpen, setQuickHabitModalOpen] = useState(false)
  const [quickNoteModalOpen, setQuickNoteModalOpen] = useState(false)

  useEffect(() => {
    initializeModules(queryClient)
  }, [queryClient])

  useEffect(() => {
    const cleanup = setupNotificationListeners((route) => {
      navigate(route)
    })
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [navigate])

  // Android / Capacitor Back Button & Escape dismissal for modals and navigation
  useEffect(() => {
    const cleanup = setupBackButton(() => {
      if (commandPaletteOpen) {
        setCommandPaletteOpen(false)
        return true
      }
      if (quickAddSheetOpen) {
        setQuickAddSheetOpen(false)
        return true
      }
      if (quickTaskModalOpen) {
        setQuickTaskModalOpen(false)
        return true
      }
      if (quickHabitModalOpen) {
        setQuickHabitModalOpen(false)
        return true
      }
      if (quickNoteModalOpen) {
        setQuickNoteModalOpen(false)
        return true
      }
      if (pathname !== '/') {
        navigate('/')
        return true
      }
      return false
    })

    return cleanup
  }, [
    commandPaletteOpen,
    quickAddSheetOpen,
    quickTaskModalOpen,
    quickHabitModalOpen,
    quickNoteModalOpen,
    pathname,
    navigate
  ])

  const handleRouteChange = (route: string) => {
    navigate(route)
  }

  const activeModule =
    moduleRegistry.getByRoute(pathname) ||
    moduleRegistry.get('dashboard') ||
    moduleRegistry.get('habits')

  const ActiveComponent = activeModule?.routes[0]?.component || (() => <div>View not found</div>)

  const today = new Date()
  const baseGreeting = getGreeting(today)
  const dashboardTitle = userName ? `${baseGreeting}, ${userName}` : baseGreeting
  const formattedDate = format(today, 'EEEE, MMM d')

  const title =
    pathname === '/' ? dashboardTitle : activeModule ? activeModule.title : 'Productivity'
  const subtitle =
    pathname === '/' ? formattedDate : activeModule ? activeModule.description : undefined

  return (
    <>
      <AppShell
        activeRoute={pathname}
        onRouteChange={handleRouteChange}
        title={title}
        subtitle={subtitle}
        onQuickAction={() => setQuickAddSheetOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      >
        <ActiveComponent />
      </AppShell>

      {/* Global Quick Add Bottom Sheet */}
      <QuickAddSheet
        open={quickAddSheetOpen}
        onOpenChange={setQuickAddSheetOpen}
        onAddTask={() => setQuickTaskModalOpen(true)}
        onAddHabit={() => setQuickHabitModalOpen(true)}
        onAddNote={() => setQuickNoteModalOpen(true)}
      />

      {/* Global Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onRouteChange={handleRouteChange}
        onOpenTaskModal={() => setQuickTaskModalOpen(true)}
        onOpenHabitModal={() => setQuickHabitModalOpen(true)}
        onOpenNoteModal={() => setQuickNoteModalOpen(true)}
      />

      {/* Global Action Modals */}
      <HabitFormModal open={quickHabitModalOpen} onOpenChange={setQuickHabitModalOpen} />
      <TaskFormModal open={quickTaskModalOpen} onOpenChange={setQuickTaskModalOpen} />
      <NoteFormModal open={quickNoteModalOpen} onOpenChange={setQuickNoteModalOpen} />

      {/* First-Run Startup Onboarding Modal */}
      <StartupModal />
    </>
  )
}

export default App
