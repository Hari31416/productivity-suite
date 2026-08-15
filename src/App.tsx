import { useState, useEffect } from 'react'
import { moduleRegistry } from '@/core/modules/registry'
import { initializeModules } from '@/modules/init'
import { AppShell } from '@/components/layout/AppShell'

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashRoute = window.location.hash.replace('#', '')
      if (hashRoute) return hashRoute
    }
    return '/habits'
  })

  useEffect(() => {
    initializeModules()
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const hashRoute = window.location.hash.replace('#', '')
      if (hashRoute) {
        setCurrentRoute(hashRoute)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleRouteChange = (route: string) => {
    setCurrentRoute(route)
    window.location.hash = route
  }

  const activeModule =
    moduleRegistry.getByRoute(currentRoute) || moduleRegistry.get('habits')

  const ActiveComponent =
    activeModule?.routes[0]?.component || (() => <div>View not found</div>)

  return (
    <AppShell
      activeRoute={currentRoute}
      onRouteChange={handleRouteChange}
      title={activeModule ? activeModule.title : 'Productivity'}
      subtitle={activeModule ? activeModule.description : undefined}
      onQuickAction={() => {
        // Quick action handler for Phase 1
      }}
    >
      <ActiveComponent />
    </AppShell>
  )
}

export default App
