# Phase 1 - Foundation, Architecture and Core Storage

## Objectives

Establish the base Single Page Application scaffolding, configure modern UI tooling, create the Dexie.js IndexedDB storage layer with the Modular Feature Registry pattern, set up TanStack Query with Zustand, and construct the responsive app shell.

## Key Deliverables

- Build and tooling setup with Vite, React 18, TypeScript 5 (strict mode), and Tailwind CSS.
- Component system integration with shadcn/ui and Lucide icons.
- Local database layer with Dexie.js and repository base abstractions.
- Modular Feature Registry system for dynamic module registration and routing.
- Responsive layout shell featuring collapsible desktop sidebar and mobile bottom navigation.
- Global theme manager (light, dark, system) with Tailwind CSS variables.

## Technical Implementation Details

### Project Scaffolding and Dependencies

Initialize the application with pnpm and install core packages:
- UI & Icons: `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`.
- State & Data: `zustand`, `@tanstack/react-query`, `dexie`, `zod`.
- Utilities: `date-fns`.

### Modular Feature Registry

Define the module contract under `src/core/modules/types.ts`:

```typescript
import type { ComponentType } from 'react'

export interface AppModuleManifest {
  id: string
  title: string
  description: string
  iconName: string
  route: string
  navOrder: number
  primaryColor?: string
  dashboardWidget?: ComponentType
  routes: {
    path: string
    component: ComponentType
    exact?: boolean
  }[]
}
```

The registry in `src/core/modules/registry.ts` manages active modules, allowing future tools to be added with zero changes to existing layout or navigation logic.

### Local Database Core

Create the IndexedDB instance in `src/core/db/index.ts`:

```typescript
import Dexie, { type Table } from 'dexie'
import type { Habit, HabitLog } from '@/modules/habits/types'
import type { Project, Task, Subtask } from '@/modules/tasks/types'
import type { Note, Tag } from '@/modules/notes/types'

export class AppDatabase extends Dexie {
  habits!: Table<Habit, string>
  habitLogs!: Table<HabitLog, string>
  projects!: Table<Project, string>
  tasks!: Table<Task, string>
  subtasks!: Table<Subtask, string>
  notes!: Table<Note, string>
  tags!: Table<Tag, string>

  constructor() {
    super('LocalProductivitySuiteDB')
    this.version(1).stores({
      habits: 'id, categoryId, frequencyType, archived, createdAt',
      habitLogs: 'id, habitId, date, timestamp, [habitId+date], completed',
      projects: 'id, name, archived, createdAt',
      tasks: 'id, projectId, status, priority, dueDate, archived, createdAt',
      subtasks: 'id, taskId, completed, order',
      notes: 'id, projectId, pinned, archived, updatedAt, *tags',
      tags: 'id, name'
    })
  }
}

export const db = new AppDatabase()
```

### Layout Shell and Navigation

- `src/components/layout/AppShell.tsx`: Responsive container handling desktop vs mobile views.
- `src/components/layout/Sidebar.tsx`: Collapsible desktop sidebar rendering module navigation items dynamically from the registry.
- `src/components/layout/BottomNav.tsx`: Touch-friendly mobile bottom navigation bar (min 44px touch targets).
- `src/components/layout/Header.tsx`: Contextual title, quick action trigger, and theme toggle.

## Verification Checklist

- Development server launches without errors via `pnpm dev`.
- Desktop viewport displays sidebar navigation; mobile viewport collapses sidebar and presents bottom navigation.
- IndexedDB database initializes in browser Application storage.
- Theme toggle switches between light and dark modes instantly without flash.
