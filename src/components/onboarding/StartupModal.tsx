import { useState } from 'react'
import { Activity, CheckSquare, FileText, ShieldCheck, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserProfile } from '@/core/profile/useUserProfile'

export function StartupModal() {
  const { hasCompletedOnboarding, completeOnboarding } = useUserProfile()
  const [nameInput, setNameInput] = useState('')

  if (hasCompletedOnboarding) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!localStorage.getItem('productivity_timezone')) {
      localStorage.setItem('productivity_timezone', 'Asia/Kolkata')
    }
    completeOnboarding(nameInput)
  }

  const handleSkip = () => {
    if (!localStorage.getItem('productivity_timezone')) {
      localStorage.setItem('productivity_timezone', 'Asia/Kolkata')
    }
    completeOnboarding('')
  }

  return (
    <Dialog open={!hasCompletedOnboarding}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden border-border/80 shadow-2xl rounded-3xl gap-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 sm:p-7 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Welcome to Productivity Suite
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Your personal, private, all-in-one productivity assistant
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start gap-3 p-3 rounded-2xl border bg-muted/20">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Activity className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">Habit Tracking</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Build habits with progress dots, timers, and streak analytics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl border bg-muted/20">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">Tasks & Kanban</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Manage tasks across list, calendar timeline, and Kanban boards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl border bg-muted/20">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <FileText className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">Markdown Notes</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Capture thoughts with rich markdown rendering, tags, and search.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl border bg-muted/20">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">100% Private</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Offline-first database. All your data stays locally on your device.
                </p>
              </div>
            </div>
          </div>

          {/* User Name Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t">
            <div className="space-y-1.5">
              <label htmlFor="startup-user-name" className="text-xs font-semibold text-foreground">
                What should we call you?
              </label>
              <Input
                id="startup-user-name"
                placeholder="Enter your name (e.g. Alex)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-11 rounded-xl text-sm bg-background border-border"
                autoFocus
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <Button
                type="submit"
                className="w-full sm:flex-1 h-11 rounded-xl font-semibold gap-2 shadow-xs"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                className="w-full sm:w-auto h-11 text-xs text-muted-foreground hover:text-foreground rounded-xl"
              >
                Skip for now
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
