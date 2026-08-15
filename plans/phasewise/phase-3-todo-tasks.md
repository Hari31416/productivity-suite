# Phase 3 - To-Do List and Task Management

## Objectives

Build the To-Do List module supporting hierarchical Projects, Tasks, and Subtasks, multiple view layouts (List, Calendar, and Kanban), due date/time scheduling, priority categorization, and fast client-side filtering.

## Key Deliverables

- Task and Project domain schema, repository layer, and TanStack Query hooks.
- List / Grouped view with smart grouping (Today, Upcoming, Overdue, by Project).
- Calendar view with Month and Week grid layouts using `date-fns`.
- Kanban board view with drag-and-drop or column status toggles (To Do, In Progress, Blocked, Done).
- Subtask checklist manager with inline item creation and completion tracking.
- Project sidebar manager with color badges and task count statistics.
- Task dashboard widget for today's priority items.

## Technical Implementation Details

### Domain Schema and Models

`src/modules/tasks/types.ts`:

```typescript
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: PriorityLevel
  dueDate?: string
  dueTime?: string
  estimatedMinutes?: number
  tags: string[]
  subtaskIds: string[]
  completedAt?: string
  createdAt: string
  updatedAt: string
  archived: boolean
}
```

### Multiple Layout Views

- List View (`src/modules/tasks/components/views/TaskListView.tsx`): Grouped sections with collapsible headers (Overdue, Today, Tomorrow, Later), priority badges, and quick-check toggles.
- Calendar View (`src/modules/tasks/components/views/TaskCalendarView.tsx`): Month/Week calendar grid generated via `date-fns` showing task pills on scheduled dates with single-click date selection.
- Kanban View (`src/modules/tasks/components/views/TaskKanbanView.tsx`): 4-column board (To Do, In Progress, Blocked, Done) with quick status moves and task cards.

### Subtask Management

- `src/modules/tasks/components/SubtaskList.tsx`: Inline subtask creator, checkboxes, progress meter (e.g., 3/5 completed), and deletion handlers.

### Component Structure

- `src/modules/tasks/components/TasksView.tsx`: Main container managing active layout mode (List, Calendar, Kanban), project selection, and search query.
- `src/modules/tasks/components/ProjectSidebar.tsx`: Project list with color pills, active task count indicators, and project creation modal.
- `src/modules/tasks/components/TaskFormModal.tsx`: Modal for creating and editing tasks with full attribute controls.
- `src/modules/tasks/components/TaskDashboardWidget.tsx`: Compact home overview card showing urgent and today's tasks.

## Verification Checklist

- Creating projects and tasks persists to IndexedDB.
- Adding subtasks updates the parent task's subtask progress meter in real time.
- Switching between List, Calendar, and Kanban views renders tasks accurately without data loss.
- Selecting a date in Calendar view displays all tasks due on that date.
- Updating task status in Kanban view updates the task status in IndexedDB and reflects in List view.
