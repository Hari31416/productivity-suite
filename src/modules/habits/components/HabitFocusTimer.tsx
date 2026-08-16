import { useState, useEffect, useRef, useMemo } from 'react'
import { Play, Pause, RotateCcw, Check, Plus, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

  const setValueMutation = useSetHabitLogValue()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Calculate accumulated minutes tracked for today from habit logs
  const todayAccumulatedMinutes = useMemo(() => {
    return logs.reduce((sum, log) => {
      if (typeof log.durationSeconds === 'number') {
        return sum + Math.round(log.durationSeconds / 60)
      }
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? targetMinutes : 0)
    }, 0)
  }, [logs, targetMinutes])

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

  const handleAddMinutes = (mins: number) => {
    const additional = mins * 60
    setTotalSeconds((prev) => prev + additional)
    setSecondsLeft((prev) => prev + additional)
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

  // Circular calculations
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border">
            <span>Today:</span>
            <strong className="text-foreground font-semibold">{todayAccumulatedMinutes} min</strong>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center pt-2 pb-6 space-y-5">
        {/* Radial SVG Circular Countdown */}
        <div className="relative flex items-center justify-center">
          <svg className="w-52 h-52 sm:w-60 sm:h-60 transform -rotate-90" viewBox="0 0 200 200">
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

          {/* Central Time & State */}
          <div className="absolute flex flex-col items-center justify-center text-center select-none">
            <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              {`${minutesDisplay}:${secondsDisplay}`}
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-1 capitalize">
              {isRunning ? 'Focusing...' : secondsLeft === 0 ? 'Session Complete' : 'Ready'}
            </span>
            {sessionCompletedCount > 0 && (
              <span className="text-[11px] font-semibold text-primary mt-1">
                {sessionCompletedCount} {sessionCompletedCount === 1 ? 'session' : 'sessions'}{' '}
                completed
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
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

        {/* Quick Add Minutes & Preset Duration Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center pt-1">
          {[5, 10, 15].map((m) => (
            <Button
              key={m}
              variant="outline"
              size="sm"
              onClick={() => handleAddMinutes(m)}
              className="h-7 text-xs px-2.5 rounded-full text-muted-foreground hover:text-foreground"
              aria-label={`Add ${m} minutes`}
            >
              <Plus className="h-3 w-3 mr-0.5" />
              <span>{m}m</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsRunning(false)
              const s = 25 * 60
              setTotalSeconds(s)
              setSecondsLeft(s)
            }}
            className={cn(
              'h-7 text-xs px-2.5 rounded-full',
              totalSeconds === 25 * 60 && 'bg-muted font-semibold text-foreground'
            )}
          >
            25m Pomodoro
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
