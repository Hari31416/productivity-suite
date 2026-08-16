import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { moduleRegistry } from '@/core/modules/registry'
import { DynamicIcon } from '@/components/icons/DynamicIcon'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface SidebarProps {
  activeRoute: string
  onRouteChange: (route: string) => void
}

export function Sidebar({ activeRoute, onRouteChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const modules = moduleRegistry.getAll()

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-card text-card-foreground transition-all duration-300 select-none',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#042F2E] border border-[#0A7A64]/40 p-1 shadow-sm">
                <img
                  src="/icon.png"
                  alt="Productivity"
                  className="h-full w-full object-contain rounded-[4px]"
                />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold tracking-tight leading-tight">
                  Productivity
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Suite</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#042F2E] border border-[#0A7A64]/40 p-1 shadow-sm">
              <img
                src="/icon.png"
                alt="Productivity"
                className="h-full w-full object-contain rounded-[4px]"
              />
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 p-2 overflow-y-auto">
          {modules.map((module) => {
            const isActive =
              activeRoute === module.route || activeRoute.startsWith(`${module.route}/`)

            const buttonContent = (
              <button
                key={module.id}
                type="button"
                onClick={() => onRouteChange(module.route)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/80 hover:bg-accent hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <DynamicIcon
                  name={module.iconName}
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-foreground/60 group-hover:text-foreground'
                  )}
                />
                {!collapsed && <span className="truncate text-left">{module.title}</span>}
              </button>
            )

            if (collapsed) {
              return (
                <Tooltip key={module.id}>
                  <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {module.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return buttonContent
          })}
        </nav>

        {/* Collapse toggle footer */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full text-foreground/70 hover:text-foreground',
              collapsed ? 'px-0 justify-center' : 'justify-start gap-2'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
