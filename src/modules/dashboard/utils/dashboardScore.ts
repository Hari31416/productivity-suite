export interface ScoreInput {
  habitsCompleted: number
  habitsTotal: number
  tasksCompleted: number
  tasksTotal: number
}

export function calculateDailyProductivityScore(input: ScoreInput): number {
  const { habitsCompleted, habitsTotal, tasksCompleted, tasksTotal } = input

  const hasHabits = habitsTotal > 0
  const hasTasks = tasksTotal > 0

  if (!hasHabits && !hasTasks) {
    return 0
  }

  if (hasHabits && !hasTasks) {
    const habitScore = Math.min(1, Math.max(0, habitsCompleted / habitsTotal))
    return Math.round(habitScore * 100)
  }

  if (!hasHabits && hasTasks) {
    const taskScore = Math.min(1, Math.max(0, tasksCompleted / tasksTotal))
    return Math.round(taskScore * 100)
  }

  const habitRatio = Math.min(1, Math.max(0, habitsCompleted / habitsTotal))
  const taskRatio = Math.min(1, Math.max(0, tasksCompleted / tasksTotal))

  const combined = habitRatio * 0.5 + taskRatio * 0.5
  return Math.round(combined * 100)
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) {
    return 'Good morning'
  }
  if (hour < 17) {
    return 'Good afternoon'
  }
  return 'Good evening'
}

export function getProductivityStatus(score: number): {
  label: string
  color: string
} {
  if (score >= 90) {
    return { label: 'Exceptional', color: 'text-emerald-600 dark:text-emerald-400' }
  }
  if (score >= 70) {
    return { label: 'Great Progress', color: 'text-blue-600 dark:text-blue-400' }
  }
  if (score >= 40) {
    return { label: 'Making Headway', color: 'text-amber-600 dark:text-amber-400' }
  }
  if (score > 0) {
    return { label: 'Getting Started', color: 'text-orange-600 dark:text-orange-400' }
  }
  return { label: 'Ready to Begin', color: 'text-muted-foreground' }
}
