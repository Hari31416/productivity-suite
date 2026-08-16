import { Plus } from 'lucide-react'
import { DynamicIcon } from '@/components/icons/DynamicIcon'
import { cn } from '@/lib/utils'

export interface BottomNavProps {
  activeRoute: string
  onRouteChange: (route: string) => void
  onQuickAdd?: () => void
}

interface NavItem {
  id: string
  title: string
  route: string
  iconName: string
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', title: 'Home', route: '/', iconName: 'LayoutDashboard' },
  { id: 'habits', title: 'Habits', route: '/habits', iconName: 'Activity' },
  { id: 'tasks', title: 'Tasks', route: '/tasks', iconName: 'CheckSquare' },
  { id: 'notes', title: 'Notes', route: '/notes', iconName: 'FileText' }
]

export function BottomNav({ activeRoute, onRouteChange, onQuickAdd }: BottomNavProps) {
  const isRouteActive = (route: string) => {
    if (route === '/') {
      return activeRoute === '/' || activeRoute === '/dashboard' || activeRoute === ''
    }
    return activeRoute === route || activeRoute.startsWith(`${route}/`)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-2 pt-1 pb-[calc(var(--safe-area-inset-bottom)+0.25rem)] md:hidden select-none shadow-lg"
      aria-label="Mobile navigation"
    >
      {/* Home */}
      <button
        type="button"
        onClick={() => onRouteChange(PRIMARY_NAV_ITEMS[0].route)}
        className={cn(
          'flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-xs font-medium transition-colors',
          isRouteActive(PRIMARY_NAV_ITEMS[0].route)
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-current={isRouteActive(PRIMARY_NAV_ITEMS[0].route) ? 'page' : undefined}
      >
        <DynamicIcon
          name={PRIMARY_NAV_ITEMS[0].iconName}
          className={cn(
            'h-5 w-5 transition-transform',
            isRouteActive(PRIMARY_NAV_ITEMS[0].route) && 'scale-110'
          )}
        />
        <span className="text-[11px] leading-tight">{PRIMARY_NAV_ITEMS[0].title}</span>
      </button>

      {/* Habits */}
      <button
        type="button"
        onClick={() => onRouteChange(PRIMARY_NAV_ITEMS[1].route)}
        className={cn(
          'flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-xs font-medium transition-colors',
          isRouteActive(PRIMARY_NAV_ITEMS[1].route)
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-current={isRouteActive(PRIMARY_NAV_ITEMS[1].route) ? 'page' : undefined}
      >
        <DynamicIcon
          name={PRIMARY_NAV_ITEMS[1].iconName}
          className={cn(
            'h-5 w-5 transition-transform',
            isRouteActive(PRIMARY_NAV_ITEMS[1].route) && 'scale-110'
          )}
        />
        <span className="text-[11px] leading-tight">{PRIMARY_NAV_ITEMS[1].title}</span>
      </button>

      {/* Center Quick Add FAB */}
      <div className="flex flex-1 items-center justify-center px-1">
        <button
          type="button"
          onClick={onQuickAdd}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition-transform focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Quick add item"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Tasks */}
      <button
        type="button"
        onClick={() => onRouteChange(PRIMARY_NAV_ITEMS[2].route)}
        className={cn(
          'flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-xs font-medium transition-colors',
          isRouteActive(PRIMARY_NAV_ITEMS[2].route)
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-current={isRouteActive(PRIMARY_NAV_ITEMS[2].route) ? 'page' : undefined}
      >
        <DynamicIcon
          name={PRIMARY_NAV_ITEMS[2].iconName}
          className={cn(
            'h-5 w-5 transition-transform',
            isRouteActive(PRIMARY_NAV_ITEMS[2].route) && 'scale-110'
          )}
        />
        <span className="text-[11px] leading-tight">{PRIMARY_NAV_ITEMS[2].title}</span>
      </button>

      {/* Notes */}
      <button
        type="button"
        onClick={() => onRouteChange(PRIMARY_NAV_ITEMS[3].route)}
        className={cn(
          'flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-xs font-medium transition-colors',
          isRouteActive(PRIMARY_NAV_ITEMS[3].route)
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-current={isRouteActive(PRIMARY_NAV_ITEMS[3].route) ? 'page' : undefined}
      >
        <DynamicIcon
          name={PRIMARY_NAV_ITEMS[3].iconName}
          className={cn(
            'h-5 w-5 transition-transform',
            isRouteActive(PRIMARY_NAV_ITEMS[3].route) && 'scale-110'
          )}
        />
        <span className="text-[11px] leading-tight">{PRIMARY_NAV_ITEMS[3].title}</span>
      </button>
    </nav>
  )
}
