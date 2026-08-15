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
import type {
  Habit,
  HabitFrequencyType,
  HabitTargetType
} from '../types'
import { DEFAULT_HABIT_CATEGORIES, PRESET_COLORS } from '../constants'
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

export function HabitFormModal({
  open,
  onOpenChange,
  habitToEdit
}: HabitFormModalProps) {
  const createMutation = useCreateHabit()
  const updateMutation = useUpdateHabit()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title)
      setDescription(habitToEdit.description || '')
      setColor(habitToEdit.color || PRESET_COLORS[0])
      setCategoryId(habitToEdit.categoryId || 'health')
      setFrequencyType(habitToEdit.frequencyType)
      setTargetDaysOfWeek(habitToEdit.targetDaysOfWeek || [1, 2, 3, 4, 5])
      setTargetCountPerWeek(habitToEdit.targetCountPerWeek || 3)
      setIntervalHours(habitToEdit.intervalHours || 3)
      setTimesPerDay(habitToEdit.timesPerDay || 3)
      setStartTime(habitToEdit.timeWindow?.startTime || '08:00')
      setEndTime(habitToEdit.timeWindow?.endTime || '20:00')
      setTargetType(habitToEdit.targetType)
      setTargetValue(habitToEdit.targetValue || 1)
      setUnit(habitToEdit.unit || '')
    } else {
      setTitle('')
      setDescription('')
      setColor(PRESET_COLORS[0])
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
    }
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
        color,
        categoryId,
        frequencyType,
        targetDaysOfWeek:
          frequencyType === 'custom_days' ? targetDaysOfWeek : undefined,
        targetCountPerWeek:
          frequencyType === 'weekly' ? targetCountPerWeek : undefined,
        intervalHours:
          frequencyType === 'subday_interval' ? intervalHours : undefined,
        timesPerDay:
          frequencyType === 'times_per_day' ? timesPerDay : undefined,
        timeWindow:
          frequencyType === 'subday_interval'
            ? { startTime, endTime }
            : undefined,
        targetType,
        targetValue:
          targetType === 'numeric' || targetType === 'timer'
            ? targetValue
            : undefined,
        unit: targetType === 'numeric' && unit ? unit.trim() : undefined,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {habitToEdit ? 'Edit Habit' : 'Create New Habit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Habit Title *</label>
            <Input
              placeholder="e.g. Read 20 pages, Drink water, Morning run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input
              placeholder="Brief note or motivation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Type</label>
              <Select
                value={targetType}
                onValueChange={(val) => setTargetType(val as HabitTargetType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Yes / No Check-in</SelectItem>
                  <SelectItem value="numeric">Numeric Counter</SelectItem>
                  <SelectItem value="timer">Timer (Minutes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === 'numeric' && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Target Goal</label>
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
                  placeholder="e.g. glasses, pages, km"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>
          )}

          {targetType === 'timer' && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <label className="text-xs font-medium">Target Duration (Minutes)</label>
              <Input
                type="number"
                min="1"
                className="mt-1"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value) || 1)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Frequency</label>
            <Select
              value={frequencyType}
              onValueChange={(val) =>
                setFrequencyType(val as HabitFrequencyType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Every Day</SelectItem>
                <SelectItem value="custom_days">Specific Days of Week</SelectItem>
                <SelectItem value="weekly">Weekly Target Count</SelectItem>
                <SelectItem value="subday_interval">Sub-day Recurring Interval</SelectItem>
                <SelectItem value="times_per_day">Multiple Times Per Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequencyType === 'custom_days' && (
            <div className="space-y-1.5 rounded-lg border bg-muted/20 p-3">
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
                        'h-8 flex-1 p-0 text-xs font-medium',
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
            <div className="rounded-lg border bg-muted/20 p-3">
              <label className="text-xs font-medium">Target Days Per Week</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={targetCountPerWeek}
                  onChange={(e) =>
                    setTargetCountPerWeek(
                      Math.max(1, Math.min(7, Number(e.target.value) || 1))
                    )
                  }
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  times per week
                </span>
              </div>
            </div>
          )}

          {frequencyType === 'subday_interval' && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
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
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Interval (Hours)</label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={intervalHours}
                  onChange={(e) =>
                    setIntervalHours(Number(e.target.value) || 1)
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Generates check-in checkpoints throughout your active window.
                </p>
              </div>
            </div>
          )}

          {frequencyType === 'times_per_day' && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <label className="text-xs font-medium">Check-ins Per Day</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={timesPerDay}
                  onChange={(e) =>
                    setTimesPerDay(
                      Math.max(1, Math.min(24, Number(e.target.value) || 1))
                    )
                  }
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  slots daily
                </span>
              </div>
            </div>
          )}

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

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {habitToEdit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
