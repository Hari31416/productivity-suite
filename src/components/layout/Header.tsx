import { Sun, Moon, Laptop, Plus, Menu, Search } from 'lucide-react'
import { useTheme } from '@/core/theme/useTheme'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export interface HeaderProps {
  title: string
  subtitle?: string
  onQuickAction?: () => void
  onOpenCommandPalette?: () => void
  onToggleSidebar?: () => void
}

export function Header({
  title,
  subtitle,
  onQuickAction,
  onOpenCommandPalette,
  onToggleSidebar
}: HeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 flex min-h-[3.75rem] w-full items-center justify-between border-b bg-background/95 px-4 pt-[env(safe-area-inset-top,0px)] pb-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden h-10 w-10 min-h-[44px] min-w-[44px]"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="h-9 min-h-[36px] sm:h-8 gap-2 px-2.5 text-xs text-muted-foreground hover:text-foreground font-normal sm:w-48 justify-between"
            aria-label="Search and command palette"
          >
            <div className="flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search / Commands</span>
              <span className="sm:hidden">Search</span>
            </div>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        )}

        {onQuickAction && (
          <Button
            size="sm"
            onClick={onQuickAction}
            className="h-9 min-h-[36px] sm:h-8 gap-1.5 px-3 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Quick Add</span>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 min-h-[36px] min-w-[36px] sm:h-8 sm:w-8"
              aria-label="Select theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
              {theme === 'light' && <span className="ml-auto text-xs text-primary">Active</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
              {theme === 'dark' && <span className="ml-auto text-xs text-primary">Active</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>System</span>
              {theme === 'system' && <span className="ml-auto text-xs text-primary">Active</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
