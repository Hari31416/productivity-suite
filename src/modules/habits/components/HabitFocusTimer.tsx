import { useState, useEffect, useRef, useMemo } from 'react'
import { Play, Pause, RotateCcw, Check, Plus, Minus, Timer, Sparkles, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import type { Habit, HabitLog } from '../types'
import { useSetHabitLogValue } from '../hooks/useHabits'
import { fireConfetti } from '@/lib/confetti'
import { cn } from '@/lib/utils'

interface HabitFocusTimerProps {
  habit: Habit
  selectedDate: string
  logs: HabitLog[]
  onSessionComplete?: (durationMinutes: number) => void
}

export function HabitFocusTimer({
  habit,
  selectedDate,
  logs,
  onSessionComplete
}: HabitFocusTimerProps) {
  const targetMinutes = Math.max(1, habit.targetValue || 25)
  const [totalSeconds, setTotalSeconds] = useState(targetMinutes * 60)
  const [secondsLeft, setSecondsLeft] = useState(targetMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0)

  // Direct duration edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [customMinutesInput, setCustomMinutesInput] = useState(`${Math.round(totalSeconds / 60)}`)

  const setValueMutation = useSetHabitLogValue()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Calculate accumulated minutes tracked for today from habit logs
  const todayAccumulatedMinutes = useMemo(() => {
    return logs.reduce((sum, log) => {
      if (typeof log.durationSeconds === 'number' && log.durationSeconds > 0) {
        return sum + Math.round(log.durationSeconds / 60)
      }
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? targetMinutes : 0)
    }, 0)
  }, [logs, targetMinutes])

  const remainingMinutes = Math.max(0, targetMinutes - todayAccumulatedMinutes)

  const prevTargetRef = useRef(targetMinutes)
  useEffect(() => {
    if (prevTargetRef.current !== targetMinutes) {
      prevTargetRef.current = targetMinutes
      if (!isRunning) {
        const s = targetMinutes * 60
        setTotalSeconds(s)
        setSecondsLeft(s)
      }
    }
  }, [targetMinutes, isRunning])

  // Timer interval engine
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setIsRunning(false)
            handleFinishSession(Math.round(totalSeconds / 60))
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, totalSeconds])

  const handleTogglePlay = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds)
    }
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setSecondsLeft(totalSeconds)
  }

  // Adjust duration by +mins or -mins
  const handleAdjustMinutes = (mins: number) => {
    const changeSeconds = mins * 60
    setTotalSeconds((prev) => Math.max(60, prev + changeSeconds))
    setSecondsLeft((prev) => Math.max(60, prev + changeSeconds))
  }

  // Set explicit minutes
  const handleSetExactMinutes = (mins: number) => {
    const validMins = Math.max(1, Math.min(720, mins))
    setIsRunning(false)
    const s = validMins * 60
    setTotalSeconds(s)
    setSecondsLeft(s)
  }

  const handleFinishSession = (durationMins?: number) => {
    const elapsedSeconds = totalSeconds - secondsLeft
    const elapsedMinutes =
      durationMins !== undefined ? durationMins : Math.max(1, Math.round(elapsedSeconds / 60))

    if (elapsedMinutes > 0) {
      const nextTotal = todayAccumulatedMinutes + elapsedMinutes
      setValueMutation.mutate({
        habitId: habit.id,
        date: selectedDate,
        value: nextTotal,
        completed: nextTotal >= targetMinutes
      })

      setSessionCompletedCount((c) => c + 1)
      fireConfetti({
        particleCount: 50,
        colors: [habit.color || '#0A7A64', '#10b981', '#f59e0b', '#3b82f6']
      })

      if (onSessionComplete) {
        onSessionComplete(elapsedMinutes)
      }
    }

    setIsRunning(false)
    setSecondsLeft(totalSeconds)
  }

  // Circular progress ring calculations
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - progressRatio * circumference

  const minutesDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secondsDisplay = String(secondsLeft % 60).padStart(2, '0')
  const themeColor = habit.color || '#0A7A64'

  return (
    <Card className="rounded-2xl border bg-card/80 backdrop-blur-xs overflow-hidden shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
            >
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Focus Timer</CardTitle>
              <CardDescription className="text-xs">
                Target: {targetMinutes} min session
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {remainingMinutes > 0 ? (
              <span className="text-xs text-muted-foreground bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium px-2.5 py-1 rounded-full border border-amber-500/20">
                {remainingMinutes}m remaining
              </span>
            ) : (
              <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-1 rounded-full border border-emerald-500/20">
                Target Reached
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border">
              <span>Today:</span>
              <strong className="text-foreground font-semibold">
                {todayAccumulatedMinutes} min
              </strong>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center pt-1 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
        {/* Radial SVG Circular Countdown */}
        <div className="relative flex items-center justify-center">
          <svg className="w-40 h-40 sm:w-56 sm:h-56 transform -rotate-90" viewBox="0 0 200 200">
            {/* Background Ring */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-muted/40"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke={themeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300 ease-out"
              style={{
                filter: isRunning ? `drop-shadow(0 0 8px ${themeColor}60)` : undefined
              }}
            />
          </svg>

          {/* Central Time & State (Click to edit duration) */}
          <div className="absolute flex flex-col items-center justify-center text-center select-none">
            <button
              type="button"
              onClick={() => {
                setCustomMinutesInput(`${Math.round(totalSeconds / 60)}`)
                setIsEditDialogOpen(true)
              }}
              className="group flex items-center justify-center gap-1 hover:scale-105 transition-transform"
              title="Click to edit timer duration"
            >
              <span className="font-mono text-3xl sm:text-5xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {`${minutesDisplay}:${secondsDisplay}`}
              </span>
              <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
            </button>
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5 capitalize">
              {isRunning ? 'Focusing...' : secondsLeft === 0 ? 'Session Complete' : 'Ready'}
            </span>
            {sessionCompletedCount > 0 && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-primary mt-0.5">
                {sessionCompletedCount} {sessionCompletedCount === 1 ? 'session' : 'sessions'}{' '}
                completed
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={secondsLeft === totalSeconds && !isRunning}
            className="h-10 w-10 rounded-full shrink-0"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleTogglePlay}
            size="lg"
            className="h-12 px-6 rounded-full font-semibold gap-2 shadow-md transition-all active:scale-95"
            style={{
              backgroundColor: themeColor,
              color: '#ffffff'
            }}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current ml-0.5" />
                <span>{secondsLeft === 0 ? 'Restart' : 'Start Focus'}</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleFinishSession()}
            disabled={secondsLeft === totalSeconds}
            className="h-10 w-10 rounded-full shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            title="Log elapsed time to habit"
            aria-label="Finish and log session"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
          </Button>
        </div>

        {/* Time Adjustments: Steppers & Autofill Remaining */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center pt-1">
          {/* Decrement Steppers */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustMinutes(-10)}
            disabled={secondsLeft <= 600}
            className="h-7 text-xs px-2 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Subtract 10 minutes"
          >
            <Minus className="h-3 w-3 mr-0.5" />
            <span>10m</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustMinutes(-5)}
            disabled={secondsLeft <= 300}
            className="h-7 text-xs px-2 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Subtract 5 minutes"
          >
            <Minus className="h-3 w-3 mr-0.5" />
            <span>5m</span>
          </Button>

          {/* Increment Steppers */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustMinutes(5)}
            className="h-7 text-xs px-2 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Add 5 minutes"
          >
            <Plus className="h-3 w-3 mr-0.5" />
            <span>5m</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdjustMinutes(10)}
            className="h-7 text-xs px-2 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Add 10 minutes"
          >
            <Plus className="h-3 w-3 mr-0.5" />
            <span>10m</span>
          </Button>

          {/* Autofill Remaining button if remaining > 0 */}
          {remainingMinutes > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSetExactMinutes(remainingMinutes)}
              className={cn(
                'h-7 text-xs px-2.5 rounded-full font-medium gap-1',
                totalSeconds === remainingMinutes * 60 &&
                  'bg-primary text-primary-foreground font-semibold'
              )}
            >
              <Sparkles className="h-3 w-3" />
              <span>Fill Remaining ({remainingMinutes}m)</span>
            </Button>
          )}

          {/* Presets */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSetExactMinutes(25)}
            className={cn(
              'h-7 text-xs px-2.5 rounded-full',
              totalSeconds === 25 * 60 && 'bg-muted font-semibold text-foreground'
            )}
          >
            25m Pomodoro
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSetExactMinutes(45)}
            className={cn(
              'h-7 text-xs px-2.5 rounded-full',
              totalSeconds === 45 * 60 && 'bg-muted font-semibold text-foreground'
            )}
          >
            45m
          </Button>
        </div>
      </CardContent>

      {/* Edit Duration Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Set Focus Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs text-muted-foreground">Duration in minutes (1 to 720):</label>
            <Input
              type="number"
              min={1}
              max={720}
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt(customMinutesInput, 10)
                  if (!isNaN(val) && val > 0) {
                    handleSetExactMinutes(val)
                    setIsEditDialogOpen(false)
                  }
                }
              }}
              autoFocus
              className="text-lg font-mono text-center h-11"
            />
            <div className="flex gap-1.5 flex-wrap justify-center pt-1">
              {[10, 15, 20, 25, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCustomMinutesInput(`${m}`)}
                  className="px-2 py-0.5 text-xs rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium"
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const val = parseInt(customMinutesInput, 10)
                if (!isNaN(val) && val > 0) {
                  handleSetExactMinutes(val)
                  setIsEditDialogOpen(false)
                }
              }}
              className="rounded-xl flex-1"
            >
              Set Duration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
