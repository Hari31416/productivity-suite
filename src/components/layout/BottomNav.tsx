import { moduleRegistry } from '@/core/modules/registry'
import { DynamicIcon } from '@/components/icons/DynamicIcon'
import { cn } from '@/lib/utils'

export interface BottomNavProps {
  activeRoute: string
  onRouteChange: (route: string) => void
}

export function BottomNav({ activeRoute, onRouteChange }: BottomNavProps) {
  const modules = moduleRegistry.getAll()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-2 pt-1 pb-[calc(var(--safe-area-inset-bottom)+0.25rem)] md:hidden select-none shadow-lg"
      aria-label="Mobile navigation"
    >
      {modules.map((module) => {
        const isActive =
          activeRoute === module.route ||
          activeRoute.startsWith(`${module.route}/`)

        return (
          <button
            key={module.id}
            type="button"
            onClick={() => onRouteChange(module.route)}
            className={cn(
              'flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <DynamicIcon
              name={module.iconName}
              className={cn(
                'h-5 w-5 transition-transform',
                isActive && 'scale-110'
              )}
            />
            <span className="text-[11px] leading-tight truncate max-w-[64px]">
              {module.title}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
