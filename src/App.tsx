import { useState, useEffect } from 'react'
import { moduleRegistry } from '@/core/modules/registry'
import { initializeModules } from '@/modules/init'
import { AppShell } from '@/components/layout/AppShell'
import { CommandPalette } from '@/components/command/CommandPalette'
import { HabitFormModal } from '@/modules/habits/components/HabitFormModal'
import { TaskFormModal } from '@/modules/tasks/components/TaskFormModal'
import { NoteFormModal } from '@/modules/notes/components/NoteFormModal'

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashRoute = window.location.hash.replace('#', '')
      if (hashRoute) return hashRoute
    }
    return '/'
  })

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [quickTaskModalOpen, setQuickTaskModalOpen] = useState(false)
  const [quickHabitModalOpen, setQuickHabitModalOpen] = useState(false)
  const [quickNoteModalOpen, setQuickNoteModalOpen] = useState(false)

  useEffect(() => {
    initializeModules()
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const hashRoute = window.location.hash.replace('#', '')
      if (hashRoute) {
        setCurrentRoute(hashRoute)
      } else {
        setCurrentRoute('/')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Android / Capacitor Back Button & Escape dismissal for modals
  useEffect(() => {
    const handleBack = (e: Event) => {
      if (commandPaletteOpen) {
        e.preventDefault()
        setCommandPaletteOpen(false)
        return
      }
      if (quickTaskModalOpen) {
        e.preventDefault()
        setQuickTaskModalOpen(false)
        return
      }
      if (quickHabitModalOpen) {
        e.preventDefault()
        setQuickHabitModalOpen(false)
        return
      }
      if (quickNoteModalOpen) {
        e.preventDefault()
        setQuickNoteModalOpen(false)
        return
      }
    }

    // Android webview / Capacitor backbutton event
    document.addEventListener('backbutton', handleBack)
    window.addEventListener('ionBackButton', handleBack)

    return () => {
      document.removeEventListener('backbutton', handleBack)
      window.removeEventListener('ionBackButton', handleBack)
    }
  }, [
    commandPaletteOpen,
    quickTaskModalOpen,
    quickHabitModalOpen,
    quickNoteModalOpen
  ])

  const handleRouteChange = (route: string) => {
    setCurrentRoute(route)
    window.location.hash = route
  }

  const activeModule =
    moduleRegistry.getByRoute(currentRoute) ||
    moduleRegistry.get('dashboard') ||
    moduleRegistry.get('habits')

  const ActiveComponent =
    activeModule?.routes[0]?.component || (() => <div>View not found</div>)

  return (
    <>
      <AppShell
        activeRoute={currentRoute}
        onRouteChange={handleRouteChange}
        title={activeModule ? activeModule.title : 'Productivity'}
        subtitle={activeModule ? activeModule.description : undefined}
        onQuickAction={() => setCommandPaletteOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      >
        <ActiveComponent />
      </AppShell>

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
      <HabitFormModal
        open={quickHabitModalOpen}
        onOpenChange={setQuickHabitModalOpen}
      />
      <TaskFormModal
        open={quickTaskModalOpen}
        onOpenChange={setQuickTaskModalOpen}
      />
      <NoteFormModal
        open={quickNoteModalOpen}
        onOpenChange={setQuickNoteModalOpen}
      />
    </>
  )
}

export default App
