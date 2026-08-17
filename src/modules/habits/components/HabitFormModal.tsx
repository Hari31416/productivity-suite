import { useState, useEffect, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { CheckCircle2, Hash, Timer, Plus, X, Clock } from 'lucide-react'
import type { Habit, HabitFrequencyType, HabitTargetType } from '../types'
import { DEFAULT_HABIT_CATEGORIES, PRESET_COLORS, HABIT_ICONS } from '../constants'
import { useCreateHabit, useUpdateHabit } from '../hooks/useHabits'
import { cn } from '@/lib/utils'

interface HabitFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habitToEdit?: Habit | null
}

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 }
]

const UNIT_PRESETS = ['glasses', 'pages', 'reps', 'steps', 'ml', 'km', 'mins', 'cal']
const TIMER_PRESETS = [15, 25, 30, 45, 60]
const REMINDER_PRESETS = [
  { label: 'Morning', time: '08:00' },
  { label: 'Midday', time: '12:30' },
  { label: 'Evening', time: '18:00' },
  { label: 'Night', time: '21:30' }
]

export function HabitFormModal({ open, onOpenChange, habitToEdit }: HabitFormModalProps) {
  const createMutation = useCreateHabit()
  const updateMutation = useUpdateHabit()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [motivationNotes, setMotivationNotes] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState('Bed')
  const [categoryId, setCategoryId] = useState('health')
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily')
  const [targetDaysOfWeek, setTargetDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5])
  const [targetCountPerWeek, setTargetCountPerWeek] = useState<number>(3)
  const [intervalHours, setIntervalHours] = useState<number>(3)
  const [timesPerDay, setTimesPerDay] = useState<number>(3)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('20:00')
  const [targetType, setTargetType] = useState<HabitTargetType>('boolean')
  const [targetValue, setTargetValue] = useState<number>(1)
  const [unit, setUnit] = useState('')
  const [reminderTimes, setReminderTimes] = useState<string[]>([])
  const [newReminderInput, setNewReminderInput] = useState('08:00')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title)
      setDescription(habitToEdit.description || '')
      setMotivationNotes(habitToEdit.motivationNotes || '')
      setColor(habitToEdit.color || PRESET_COLORS[0])
      setIcon(habitToEdit.icon || 'Bed')
      setCategoryId(habitToEdit.categoryId || 'health')
      setFrequencyType(habitToEdit.frequencyType)
      setTargetDaysOfWeek(habitToEdit.targetDaysOfWeek || [1, 2, 3, 4, 5])
      setTargetCountPerWeek(habitToEdit.targetCountPerWeek || 3)
      setIntervalHours(habitToEdit.intervalHours || 3)
      setTimesPerDay(habitToEdit.timesPerDay || 3)
      setStartTime(habitToEdit.timeWindow?.startTime || '08:00')
      setEndTime(habitToEdit.timeWindow?.endTime || '20:00')
      setTargetType(habitToEdit.targetType)
      setTargetValue(habitToEdit.targetValue || (habitToEdit.targetType === 'timer' ? 25 : 1))
      setUnit(habitToEdit.unit || '')
      setReminderTimes(habitToEdit.reminderTimes || [])
    } else {
      setTitle('')
      setDescription('')
      setMotivationNotes('')
      setColor(PRESET_COLORS[0])
      setIcon('Bed')
      setCategoryId('health')
      setFrequencyType('daily')
      setTargetDaysOfWeek([1, 2, 3, 4, 5])
      setTargetCountPerWeek(3)
      setIntervalHours(3)
      setTimesPerDay(3)
      setStartTime('08:00')
      setEndTime('20:00')
      setTargetType('boolean')
      setTargetValue(1)
      setUnit('')
      setReminderTimes([])
    }
    setNewReminderInput('08:00')
    setError(null)
  }, [habitToEdit, open])

  const toggleDay = (dayVal: number) => {
    if (targetDaysOfWeek.includes(dayVal)) {
      if (targetDaysOfWeek.length === 1) return
      setTargetDaysOfWeek(targetDaysOfWeek.filter((d) => d !== dayVal))
    } else {
      setTargetDaysOfWeek([...targetDaysOfWeek, dayVal].sort())
    }
  }

  const handleAddReminder = () => {
    if (!newReminderInput) return
    if (!reminderTimes.includes(newReminderInput)) {
      setReminderTimes([...reminderTimes, newReminderInput].sort())
    }
  }

  const handleRemoveReminder = (timeStr: string) => {
    setReminderTimes(reminderTimes.filter((t) => t !== timeStr))
  }

  const handleSelectTargetType = (type: HabitTargetType) => {
    setTargetType(type)
    if (type === 'timer' && (!targetValue || targetValue === 1)) {
      setTargetValue(25)
    } else if (type === 'numeric' && (!targetValue || targetValue === 25)) {
      setTargetValue(8)
      if (!unit) setUnit('glasses')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Habit title is required')
      return
    }

    try {
      const habitPayload: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        motivationNotes: motivationNotes.trim() || undefined,
        color,
        icon,
        categoryId,
        frequencyType,
        targetDaysOfWeek: frequencyType === 'custom_days' ? targetDaysOfWeek : undefined,
        targetCountPerWeek: frequencyType === 'weekly' ? targetCountPerWeek : undefined,
        intervalHours: frequencyType === 'subday_interval' ? intervalHours : undefined,
        timesPerDay: frequencyType === 'times_per_day' ? timesPerDay : undefined,
        timeWindow: frequencyType === 'subday_interval' ? { startTime, endTime } : undefined,
        targetType,
        targetValue: targetType === 'numeric' || targetType === 'timer' ? targetValue : undefined,
        unit: targetType === 'numeric' && unit ? unit.trim() : undefined,
        reminderTimes: reminderTimes.length > 0 ? reminderTimes : undefined,
        pinned: habitToEdit ? habitToEdit.pinned : false,
        archived: habitToEdit ? habitToEdit.archived : false
      }

      if (habitToEdit) {
        await updateMutation.mutateAsync({
          id: habitToEdit.id,
          updates: habitPayload
        })
      } else {
        await createMutation.mutateAsync(habitPayload)
      }

      onOpenChange(false)
    } catch {
      setError('Failed to save habit. Please check your inputs.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{habitToEdit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">{error}</div>
          )}

          {/* Habit Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Habit Title *</label>
            <Input
              placeholder="e.g. Read 20 pages, Hydration, Morning Meditation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Segmented Type Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Habit Tracking Model</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/60 border">
              <button
                type="button"
                onClick={() => handleSelectTargetType('boolean')}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all',
                  targetType === 'boolean'
                    ? 'bg-background text-foreground shadow-xs border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <CheckCircle2 className="h-4 w-4 mb-1" />
                <span>Yes / No</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTargetType('numeric')}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all',
                  targetType === 'numeric'
                    ? 'bg-background text-foreground shadow-xs border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Hash className="h-4 w-4 mb-1" />
                <span>Counter</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTargetType('timer')}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all',
                  targetType === 'timer'
                    ? 'bg-background text-foreground shadow-xs border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Timer className="h-4 w-4 mb-1" />
                <span>Focus Timer</span>
              </button>
            </div>
          </div>

          {/* Target & Unit Configuration */}
          {targetType === 'numeric' && (
            <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Daily Target Goal</label>
                  <Input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Unit</label>
                  <Input
                    placeholder="e.g. glasses, pages, reps"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick Unit Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-muted-foreground">Presets:</span>
                {UNIT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setUnit(p)}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors',
                      unit.toLowerCase() === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {targetType === 'timer' && (
            <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Target Duration (Minutes)</label>
                <Input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value) || 1)}
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-muted-foreground">Presets:</span>
                {TIMER_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTargetValue(mins)}
                    className={cn(
                      'px-2.5 py-0.5 rounded-md text-[11px] font-medium border transition-colors',
                      targetValue === mins
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {DEFAULT_HABIT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency Options */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Schedule & Frequency</label>
            <Select
              value={frequencyType}
              onValueChange={(val) => setFrequencyType(val as HabitFrequencyType)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="daily">Every Day</SelectItem>
                <SelectItem value="custom_days">Specific Days of Week</SelectItem>
                <SelectItem value="weekly">Weekly Target Count</SelectItem>
                <SelectItem value="subday_interval">Sub-day Recurring Interval</SelectItem>
                <SelectItem value="times_per_day">Multiple Times Per Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequencyType === 'custom_days' && (
            <div className="space-y-1.5 rounded-xl border bg-muted/20 p-3">
              <label className="text-xs font-medium">Active Days</label>
              <div className="flex items-center gap-1.5 pt-1">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = targetDaysOfWeek.includes(d.value)
                  return (
                    <Button
                      key={d.value}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => toggleDay(d.value)}
                      className={cn(
                        'h-8 flex-1 p-0 text-xs font-medium rounded-lg',
                        isSelected && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {d.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {frequencyType === 'weekly' && (
            <div className="rounded-xl border bg-muted/20 p-3">
              <label className="text-xs font-medium">Target Days Per Week</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={targetCountPerWeek}
                  onChange={(e) =>
                    setTargetCountPerWeek(Math.max(1, Math.min(7, Number(e.target.value) || 1)))
                  }
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  times per week
                </span>
              </div>
            </div>
          )}

          {frequencyType === 'subday_interval' && (
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">End Time</label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Interval (Hours)</label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(Number(e.target.value) || 1)}
                />
              </div>
            </div>
          )}

          {frequencyType === 'times_per_day' && (
            <div className="rounded-xl border bg-muted/20 p-3">
              <label className="text-xs font-medium">Check-ins Per Day</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={timesPerDay}
                  onChange={(e) =>
                    setTimesPerDay(Math.max(1, Math.min(24, Number(e.target.value) || 1)))
                  }
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">slots daily</span>
              </div>
            </div>
          )}

          {/* Multi-Reminder Timeline */}
          <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Daily Reminder Times</span>
              </label>
            </div>

            {/* Existing Reminder Pills */}
            <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
              {reminderTimes.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  No reminders configured. Add below to get notified.
                </span>
              ) : (
                reminderTimes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-background border text-foreground"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReminder(t)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                      aria-label={`Remove reminder ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Preset Times Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-muted-foreground">Quick Presets:</span>
              {REMINDER_PRESETS.map((p) => {
                const isSelected = reminderTimes.includes(p.time)
                return (
                  <button
                    key={p.time}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveReminder(p.time)
                      } else {
                        setReminderTimes([...reminderTimes, p.time].sort())
                      }
                    }}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {p.label} ({p.time})
                  </button>
                )
              })}
            </div>

            {/* Add Custom Reminder Input */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="time"
                value={newReminderInput}
                onChange={(e) => setNewReminderInput(e.target.value)}
                className="h-8 text-xs w-32"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReminder}
                className="h-8 text-xs gap-1 rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Time</span>
              </Button>
            </div>
          </div>

          {/* Motivation & Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Motivation / Personal Why (Optional)</label>
            <Input
              placeholder="e.g. Better health, clearer focus, long-term vitality"
              value={motivationNotes}
              onChange={(e) => setMotivationNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input
              placeholder="Brief instructions or notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color Theme</label>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Habit Icon</label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 pt-1">
              {HABIT_ICONS.map((item) => {
                const IconComponent = item.icon
                const isSelected = (icon || '').toLowerCase() === item.name.toLowerCase()
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={cn(
                      'h-9 rounded-lg border flex items-center justify-center text-muted-foreground transition-all hover:text-foreground hover:bg-muted/60',
                      isSelected &&
                        'border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-1 ring-offset-background'
                    )}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {habitToEdit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
