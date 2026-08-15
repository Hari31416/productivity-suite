import { format, addDays, nextDay, parseISO, isValid } from 'date-fns'
import type { PriorityLevel } from '../types'

export interface ParsedTaskInput {
  title: string
  rawTitle: string
  priority?: PriorityLevel
  dueDate?: string
  projectId?: string
  projectName?: string
  tags: string[]
}

export interface ProjectLookup {
  id: string
  name: string
}

const DAY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6
}

export function parseSmartTaskInput(
  rawInput: string,
  availableProjects: ProjectLookup[] = []
): ParsedTaskInput {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return {
      title: '',
      rawTitle: rawInput,
      tags: []
    }
  }

  let working = trimmed
  let priority: PriorityLevel | undefined
  let dueDate: string | undefined
  let matchedProjectId: string | undefined
  let matchedProjectName: string | undefined
  const tags: string[] = []

  // 1. Parse priority (!urgent, !high, !med, !medium, !low, !p1, !p2, !p3, !p4)
  const priorityRegex = /(?:^|\s)!([a-zA-Z0-9_-]+)(?=\s|$)/gi
  working = working.replace(priorityRegex, (_match, token: string) => {
    const lower = token.toLowerCase()
    if (lower === 'urgent' || lower === 'p1') {
      priority = 'urgent'
      return ''
    }
    if (lower === 'high' || lower === 'p2') {
      priority = 'high'
      return ''
    }
    if (lower === 'medium' || lower === 'med' || lower === 'p3') {
      priority = 'medium'
      return ''
    }
    if (lower === 'low' || lower === 'p4') {
      priority = 'low'
      return ''
    }
    return _match
  })

  // 2. Parse due date (@today, @tomorrow, @mon, @monday, @2026-08-20, etc.)
  const dateRegex = /(?:^|\s)@([a-zA-Z0-9_\-\/]+)(?=\s|$)/gi
  working = working.replace(dateRegex, (_match, token: string) => {
    const lower = token.toLowerCase()
    const now = new Date()

    if (lower === 'today') {
      dueDate = format(now, 'yyyy-MM-dd')
      return ''
    }
    if (lower === 'tomorrow' || lower === 'tmrw') {
      dueDate = format(addDays(now, 1), 'yyyy-MM-dd')
      return ''
    }

    if (DAY_MAP[lower] !== undefined) {
      const targetDay = DAY_MAP[lower]
      const targetDate = nextDay(now, targetDay)
      dueDate = format(targetDate, 'yyyy-MM-dd')
      return ''
    }

    // ISO date check: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
      const parsed = parseISO(token)
      if (isValid(parsed)) {
        dueDate = token
        return ''
      }
    }

    return _match
  })

  // 3. Parse projects and tags (#tag, #project)
  const hashRegex = /(?:^|\s)#([a-zA-Z0-9_\-]+)(?=\s|$)/gi
  working = working.replace(hashRegex, (_match, token: string) => {
    const lowerToken = token.toLowerCase().replace(/[-_]/g, '')
    // Try finding matching project
    const foundProject = availableProjects.find((p) => {
      const pClean = p.name.toLowerCase().replace(/[\s\-_]/g, '')
      return pClean === lowerToken
    })

    if (foundProject && !matchedProjectId) {
      matchedProjectId = foundProject.id
      matchedProjectName = foundProject.name
      return ''
    }

    // Otherwise treat as tag
    if (!tags.includes(token)) {
      tags.push(token)
    }
    return ''
  })

  const cleanedTitle = working.replace(/\s+/g, ' ').trim()

  return {
    title: cleanedTitle || trimmed,
    rawTitle: rawInput,
    priority,
    dueDate,
    projectId: matchedProjectId,
    projectName: matchedProjectName,
    tags
  }
}
