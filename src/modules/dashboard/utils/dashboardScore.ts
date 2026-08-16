export interface ScoreInput {
  habitsCompleted: number
  habitsTotal: number
  tasksCompleted: number
  tasksTotal: number
}

export function calculateDailyProductivityScore(input: ScoreInput): number {
  const { habitsCompleted, habitsTotal, tasksCompleted, tasksTotal } = input

  const totalItems = habitsTotal + tasksTotal
  if (totalItems <= 0) {
    return 0
  }

  const completedItems =
    Math.min(habitsCompleted, habitsTotal) + Math.min(tasksCompleted, tasksTotal)
  const ratio = Math.min(1, Math.max(0, completedItems / totalItems))
  return Math.round(ratio * 100)
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
