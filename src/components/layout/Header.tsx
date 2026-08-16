import { Plus, Menu, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface HeaderProps {
  title: string
  subtitle?: string
  activeRoute?: string
  onRouteChange?: (route: string) => void
  onQuickAction?: () => void
  onOpenCommandPalette?: () => void
  onToggleSidebar?: () => void
}

export function Header({
  title,
  subtitle,
  activeRoute,
  onRouteChange,
  onQuickAction,
  onOpenCommandPalette,
  onToggleSidebar
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-3 pt-[env(safe-area-inset-top,0px)] backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden h-9 w-9 min-h-[36px] min-w-[36px] shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-xl truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Command Palette / Search Trigger */}
        {onOpenCommandPalette && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="h-10 w-10 sm:w-48 sm:h-8 sm:px-3 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 gap-1.5 text-xs text-muted-foreground hover:text-foreground font-normal sm:justify-between"
            aria-label="Search and command palette"
          >
            <div className="flex items-center gap-1.5">
              <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Search / Commands</span>
            </div>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        )}

        {/* Quick Add only on desktop since mobile has bottom nav center FAB */}
        {onQuickAction && (
          <Button
            size="sm"
            onClick={onQuickAction}
            className="hidden sm:inline-flex sm:px-3 sm:h-8 gap-1.5 text-xs font-medium"
            aria-label="Quick add item"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Quick Add</span>
          </Button>
        )}

        {onRouteChange && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onRouteChange('/settings')}
            className={cn(
              'h-10 w-10 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
              activeRoute === '/settings' && 'border-muted text-muted-foreground bg-muted/40'
            )}
            aria-label="Open settings"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
