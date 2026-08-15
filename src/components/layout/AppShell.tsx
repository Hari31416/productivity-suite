import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export interface AppShellProps {
  children: React.ReactNode
  activeRoute: string
  onRouteChange: (route: string) => void
  title: string
  subtitle?: string
  onQuickAction?: () => void
  onOpenCommandPalette?: () => void
}

export function AppShell({
  children,
  activeRoute,
  onRouteChange,
  title,
  subtitle,
  onQuickAction,
  onOpenCommandPalette
}: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar activeRoute={activeRoute} onRouteChange={onRouteChange} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onQuickAction={onQuickAction}
          onOpenCommandPalette={onOpenCommandPalette}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeRoute={activeRoute} onRouteChange={onRouteChange} />
    </div>
  )
}
