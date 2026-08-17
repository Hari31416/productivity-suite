import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Timer,
  Hash
} from 'lucide-react'
import type { Habit, HabitRoutineStack } from '../types'
import { DEFAULT_HABIT_CATEGORIES } from '../constants'
import { useCreateHabit, useUpdateHabit } from '../hooks/useHabits'

interface RoutineStepItem {
  id: string // habitId if existing, or temp id
  isExisting: boolean
  title: string
  targetType: 'boolean' | 'timer' | 'numeric'
  targetValue?: number
  unit?: string
  color: string
  icon?: string
  categoryId?: string
}

interface RoutineStackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingRoutine?: HabitRoutineStack | null
  allHabits: Habit[]
}

const ROUTINE_PRESETS = [
  {
    name: 'Morning Routine',
    steps: [
      { title: 'Hydrate 500ml', targetType: 'boolean' as const, color: '#3b82f6' },
      {
        title: 'Morning Stretch',
        targetType: 'timer' as const,
        targetValue: 10,
        unit: 'mins',
        color: '#10b981'
      },
      {
        title: 'Mindfulness Meditation',
        targetType: 'timer' as const,
        targetValue: 15,
        unit: 'mins',
        color: '#8b5cf6'
      }
    ]
  },
  {
    name: 'Evening Wind Down',
    steps: [
      { title: 'Review Daily Tasks', targetType: 'boolean' as const, color: '#f59e0b' },
      { title: 'Read 15 Pages', targetType: 'boolean' as const, color: '#ec4899' },
      {
        title: 'Screen-Free Meditation',
        targetType: 'timer' as const,
        targetValue: 10,
        unit: 'mins',
        color: '#6366f1'
      }
    ]
  },
  {
    name: 'Deep Work Flow',
    steps: [
      { title: 'Plan Top 3 Priorities', targetType: 'boolean' as const, color: '#0ea5e9' },
      {
        title: 'Deep Work Focus Block',
        targetType: 'timer' as const,
        targetValue: 45,
        unit: 'mins',
        color: '#84cc16'
      },
      { title: 'Log Progress & Take Break', targetType: 'boolean' as const, color: '#14b8a6' }
    ]
  },
  {
    name: 'Gym & Fitness Ritual',
    steps: [
      {
        title: 'Warm-up & Mobility',
        targetType: 'timer' as const,
        targetValue: 10,
        unit: 'mins',
        color: '#f97316'
      },
      {
        title: 'Core Workout Session',
        targetType: 'timer' as const,
        targetValue: 40,
        unit: 'mins',
        color: '#ef4444'
      },
      { title: 'Post-Workout Shake', targetType: 'boolean' as const, color: '#10b981' }
    ]
  }
]

export const RoutineStackModal: React.FC<RoutineStackModalProps> = ({
  open,
  onOpenChange,
  existingRoutine,
  allHabits
}) => {
  const [routineName, setRoutineName] = useState('')
  const [steps, setSteps] = useState<RoutineStepItem[]>([])
  const [selectedExistingHabitId, setSelectedExistingHabitId] = useState('')
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepTargetType, setNewStepTargetType] = useState<'boolean' | 'timer' | 'numeric'>(
    'boolean'
  )
  const [newStepTargetValue, setNewStepTargetValue] = useState(15)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const createHabitMutation = useCreateHabit()
  const updateHabitMutation = useUpdateHabit()

  useEffect(() => {
    if (open) {
      setError('')
      setSelectedExistingHabitId('')
      setNewStepTitle('')
      if (existingRoutine) {
        setRoutineName(existingRoutine.name)
        setSteps(
          existingRoutine.habits.map((h) => ({
            id: h.id,
            isExisting: true,
            title: h.title,
            targetType: (h.targetType as 'boolean' | 'timer' | 'numeric') || 'boolean',
            targetValue: h.targetValue,
            unit: h.unit,
            color: h.color || '#3b82f6',
            icon: h.icon,
            categoryId: h.categoryId
          }))
        )
      } else {
        setRoutineName('')
        setSteps([])
      }
    }
  }, [open, existingRoutine])

  const handleApplyPreset = (preset: (typeof ROUTINE_PRESETS)[0]) => {
    setRoutineName(preset.name)
    setSteps(
      preset.steps.map((s, idx) => ({
        id: `temp_${Date.now()}_${idx}`,
        isExisting: false,
        title: s.title,
        targetType: s.targetType,
        targetValue: s.targetValue,
        unit: s.unit,
        color: s.color,
        categoryId: DEFAULT_HABIT_CATEGORIES[0].id
      }))
    )
  }

  const handleAddExistingHabit = () => {
    if (!selectedExistingHabitId) return
    const habit = allHabits.find((h) => h.id === selectedExistingHabitId)
    if (!habit) return

    // Avoid duplicates in steps
    if (steps.some((s) => s.id === habit.id)) {
      setError('This habit is already in the routine sequence.')
      return
    }

    setError('')
    setSteps((prev) => [
      ...prev,
      {
        id: habit.id,
        isExisting: true,
        title: habit.title,
        targetType: (habit.targetType as 'boolean' | 'timer' | 'numeric') || 'boolean',
        targetValue: habit.targetValue,
        unit: habit.unit,
        color: habit.color || '#3b82f6',
        icon: habit.icon,
        categoryId: habit.categoryId
      }
    ])
    setSelectedExistingHabitId('')
  }

  const handleAddNewStep = () => {
    if (!newStepTitle.trim()) {
      setError('Please enter a habit title.')
      return
    }

    setError('')
    const colorPalette = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#0ea5e9']
    const randomColor = colorPalette[steps.length % colorPalette.length]

    setSteps((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        isExisting: false,
        title: newStepTitle.trim(),
        targetType: newStepTargetType,
        targetValue: newStepTargetType === 'timer' ? newStepTargetValue : undefined,
        unit: newStepTargetType === 'timer' ? 'mins' : undefined,
        color: randomColor,
        categoryId: DEFAULT_HABIT_CATEGORIES[0].id
      }
    ])
    setNewStepTitle('')
    setNewStepTargetType('boolean')
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= steps.length) return
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setSteps(updated)
  }

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      setError('Please provide a routine name (e.g. Morning Routine).')
      return
    }
    if (steps.length === 0) {
      setError('Please add at least one habit step to the routine sequence.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const routineId =
        existingRoutine?.id ||
        routineName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')

      // Save each step sequentially
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const routineOrder = i + 1

        if (step.isExisting) {
          // Update existing habit with routineName and routineOrder
          await updateHabitMutation.mutateAsync({
            id: step.id,
            updates: {
              routineId,
              routineName: routineName.trim(),
              routineOrder
            }
          })
        } else {
          // Create new habit configured for this routine
          await createHabitMutation.mutateAsync({
            title: step.title,
            frequencyType: 'daily',
            targetType: step.targetType,
            targetValue: step.targetValue,
            unit: step.unit,
            color: step.color,
            categoryId: step.categoryId || DEFAULT_HABIT_CATEGORIES[0].id,
            routineId,
            routineName: routineName.trim(),
            routineOrder,
            archived: false
          })
        }
      }

      onOpenChange(false)
    } catch {
      setError('Failed to save routine stack. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Available habits not yet in this routine
  const availableHabits = allHabits.filter((h) => !h.archived && !steps.some((s) => s.id === h.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b bg-card">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <span>{existingRoutine ? 'Edit Routine Stack' : 'Create Routine Stack'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Chain habits into a sequence (1 → 2 → 3). Checking off one step prompts the next.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Quick Presets */}
          {!existingRoutine && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Quick Routine Presets</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ROUTINE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all text-left"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Routine Name */}
          <div className="space-y-1.5">
            <label htmlFor="routine-name" className="text-xs font-semibold">
              Routine Stack Name *
            </label>
            <Input
              id="routine-name"
              placeholder="e.g. Morning Ritual, Evening Wind Down"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Sequence Steps Chain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Sequence Steps ({steps.length})</label>
              <span className="text-[10px] text-muted-foreground">Order matters</span>
            </div>

            {steps.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium">No steps added yet</p>
                <p className="text-[11px]">Add existing habits or create new ones below.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border bg-card/60 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {step.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {step.targetType === 'timer' && (
                            <span className="inline-flex items-center gap-0.5 text-primary">
                              <Timer className="h-2.5 w-2.5" />
                              <span>{step.targetValue || 15} mins</span>
                            </span>
                          )}
                          {step.targetType === 'boolean' && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>Check-in</span>
                            </span>
                          )}
                          {step.targetType === 'numeric' && (
                            <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                              <Hash className="h-2.5 w-2.5" />
                              <span>Numeric</span>
                            </span>
                          )}
                          <span>•</span>
                          <span>{step.isExisting ? 'Existing Habit' : 'New Habit'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground"
                        disabled={idx === 0}
                        onClick={() => handleMoveStep(idx, 'up')}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground"
                        disabled={idx === steps.length - 1}
                        onClick={() => handleMoveStep(idx, 'down')}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveStep(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Step Builder Card */}
          <div className="rounded-xl border bg-muted/30 p-3 space-y-3">
            <h4 className="text-xs font-semibold text-foreground">Add Steps to Routine</h4>

            {/* Add Existing Habit */}
            {availableHabits.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">
                  Select from Existing Habits
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedExistingHabitId}
                    onChange={(e) => setSelectedExistingHabitId(e.target.value)}
                    className="flex-1 h-8 rounded-lg border bg-background px-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose an active habit --</option>
                    {availableHabits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title} (
                        {h.targetType === 'timer' ? `${h.targetValue || 15}m timer` : h.targetType})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-2.5 gap-1 shrink-0"
                    disabled={!selectedExistingHabitId}
                    onClick={handleAddExistingHabit}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Create New Habit Step Inline */}
            <div className="space-y-1.5 pt-1 border-t">
              <label className="text-[11px] text-muted-foreground">Or Create New Habit Step</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Habit step name..."
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
                <select
                  value={newStepTargetType}
                  onChange={(e) =>
                    setNewStepTargetType(e.target.value as 'boolean' | 'timer' | 'numeric')
                  }
                  className="w-24 h-8 rounded-lg border bg-background px-1.5 text-xs text-foreground focus:outline-hidden"
                >
                  <option value="boolean">Check-in</option>
                  <option value="timer">Timer</option>
                  <option value="numeric">Counter</option>
                </select>
                {newStepTargetType === 'timer' && (
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={newStepTargetValue}
                    onChange={(e) => setNewStepTargetValue(Number(e.target.value))}
                    className="w-14 h-8 text-xs px-1 text-center"
                    title="Duration in minutes"
                  />
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-2.5 gap-1 shrink-0"
                  disabled={!newStepTitle.trim()}
                  onClick={handleAddNewStep}
                >
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t bg-card gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveRoutine}
            disabled={isSaving}
            className="gap-1"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving Routine...' : 'Save Routine Stack'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
