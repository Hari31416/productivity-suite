import { CheckSquare, Activity, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

export interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTask: () => void
  onAddHabit: () => void
  onAddNote: () => void
}

export function QuickAddSheet({
  open,
  onOpenChange,
  onAddTask,
  onAddHabit,
  onAddNote
}: QuickAddSheetProps) {
  const handleSelect = (action: () => void) => {
    onOpenChange(false)
    setTimeout(() => {
      action()
    }, 150)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[92%] rounded-2xl p-0 gap-0 overflow-hidden border shadow-2xl bg-card">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-base font-semibold">Quick Add</DialogTitle>
        </DialogHeader>

        <div className="p-3 grid gap-2">
          <button
            type="button"
            onClick={() => handleSelect(onAddTask)}
            className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-muted/80 active:bg-muted transition-colors text-left group w-full"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">Add Task</div>
              <div className="text-xs text-muted-foreground truncate">Create a new task with due date and priority</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect(onAddHabit)}
            className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-muted/80 active:bg-muted transition-colors text-left group w-full"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">Add Habit</div>
              <div className="text-xs text-muted-foreground truncate">Track daily routines, counters, or timers</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect(onAddNote)}
            className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-muted/80 active:bg-muted transition-colors text-left group w-full"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">Add Note</div>
              <div className="text-xs text-muted-foreground truncate">Capture ideas, markdown notes, and thoughts</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
