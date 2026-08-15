# Technical Design Document - Local Productivity Suite

## Architectural Overview

The Local Productivity Suite is designed as an offline-first Single Page Application (SPA) running entirely client-side. The architecture decouples UI components from persistence via TanStack Query and Zustand stores, backed by a unified local repository pattern.

### High-Level Architecture Diagram

```text
+------------------------------------------------------------------+
|                    Browser Viewport / Capacitor Webview          |
|                                                                  |
|  +-------------------+  +-------------------+  +---------------+ |
|  |   Habit Tracker   |  |     To-Do List    |  |    Notepad    | |
|  +-------------------+  +-------------------+  +---------------+ |
|            |                      |                    |         |
|            +----------------------+--------------------+         |
|                                   |                              |
|                   +-------------------------------+              |
|                   |  Zustand (Client UI State)    |              |
|                   |  TanStack Query (Cache/Sync)  |              |
|                   +-------------------------------+              |
|                                   |                              |
|                         +-------------------+                    |
|                         |  Repository Layer |                    |
|                         +-------------------+                    |
|                                   |                              |
|                         +-------------------+                    |
|                         | Database Engine   |                    |
|                         | (Dexie / SQLite)  |                    |
|                         +-------------------+                    |
+------------------------------------------------------------------+
```

## Technology Stack

- Frontend UI: React 18 with TypeScript 5 (strict mode)
- Build and Tooling: Vite and Tailwind CSS
- UI Components: shadcn/ui and Radix Primitives with Lucide icons
- Client State and Query: Zustand (UI state) and TanStack Query (local data caching, invalidation, optimistic updates)
- Local Persistence Engine: Dexie.js (IndexedDB wrapper) with repository abstraction adaptable for SQLite / PGlite
- Charts and Analytics: Recharts for streak graphs, heatmaps, and progress charts
- Date Utilities: date-fns
- Markdown Engine: @tiptap/react for rich note authoring and preview
- Packaging Target: Capacitor for Android distribution

## Database Feasibility and Architecture Evaluation

### In-Browser Database Comparison for Web and Mobile

- Dexie.js (IndexedDB)
  - Browser Suitability: Native browser support, zero WASM overhead, instant startup time.
  - Mobile & Capacitor Suitability: Runs directly inside Android WebView IndexedDB without native plugins or build complexities.
  - Pros: Lightweight (~20KB), battle-tested, rich index querying, zero extra build toolchains.
  - Cons: No raw SQL dialect (uses NoSQL-style query API).
- SQLite in Browser (wa-sqlite / official SQLite WASM + OPFS / `@capacitor-community/sqlite`)
  - Browser Suitability: WASM-compiled binary with OPFS (Origin Private File System) or IndexedDB VFS.
  - Mobile & Capacitor Suitability: Highly native on Android using `@capacitor-community/sqlite` which interfaces with native Android SQLite drivers.
  - Pros: Full SQL querying, exact schema parity with desktop/server SQLite, native Android file persistence.
  - Cons: Requires separate web fallback configuration, WASM bundle overhead (~1MB) on web.
- PGlite (Embedded Postgres WASM by ElectricSQL)
  - Browser Suitability: Runs full PostgreSQL in WASM with IndexedDB or OPFS persistence.
  - Mobile & Capacitor Suitability: Runs inside Android WebView without native plugins.
  - Pros: Full PostgreSQL syntax, JSONB operators, live reactive queries.
  - Cons: Higher memory footprint, ~3MB WASM download, slower cold start on lower-end mobile devices.

### Recommended Strategy

- Primary Storage Engine: Dexie.js (IndexedDB) for core web application due to instant startup, lightweight footprint, and seamless WebView compatibility.
- Abstraction: Repository Layer pattern (`IHabitRepository`, `ITaskRepository`, `INoteRepository`) wrapping database calls behind async interfaces.
- Query Caching: TanStack Query manages query keys, in-memory caching, mutation pipelines, and optimistic UI updates.
- Migration to Capacitor SQLite: When building the Android app, the repository implementation can seamlessly bind to `@capacitor-community/sqlite` or retain IndexedDB WebView persistence without modifying UI components.

## Data Models and Schema

### Habit Tracker Models

```typescript
export type HabitFrequencyType = 'daily' | 'weekly' | 'custom_days' | 'subday_interval' | 'times_per_day'

export type HabitTargetType = 'boolean' | 'numeric' | 'timer'

export interface Habit {
  id: string
  title: string
  description?: string
  color: string
  icon?: string
  categoryId?: string
  frequencyType: HabitFrequencyType
  targetDaysOfWeek?: number[]
  targetCountPerWeek?: number
  intervalHours?: number
  timesPerDay?: number
  timeWindow?: {
    startTime: string
    endTime: string
  }
  targetType: HabitTargetType
  targetValue?: number
  unit?: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface HabitLog {
  id: string
  habitId: string
  date: string
  timestamp: string
  intervalIndex?: number
  completed: boolean
  value?: number
  durationSeconds?: number
  note?: string
  createdAt: string
  updatedAt: string
}
```

### To-Do List Models

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

### Notepad Models

```typescript
export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  projectId?: string
  pinned: boolean
  color?: string
  wordCount: number
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface Tag {
  id: string
  name: string
  color: string
}
```

## Storage and Persistence Strategy

### Database Schema Definition

Dexie.js manages IndexedDB versioning and indexing.

```typescript
import Dexie, { type Table } from 'dexie'

export class ProductivityDatabase extends Dexie {
  habits!: Table<Habit, string>
  habitLogs!: Table<HabitLog, string>
  projects!: Table<Project, string>
  tasks!: Table<Task, string>
  subtasks!: Table<Subtask, string>
  notes!: Table<Note, string>
  tags!: Table<Tag, string>

  constructor() {
    super('ProductivitySuiteDB')
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

export const db = new ProductivityDatabase()
```

### Data Backup and Migration Engine

- Encrypted Compressed Archive:
  - Serialization: Serializes table datasets into individual JSON files inside a compressed container using `fflate`.
  - Cryptography: Encrypts the archive using Web Crypto API (`AES-GCM` 256-bit key derived via `PBKDF2` with SHA-256 and a random salt).
  - Decryption and Verification: Validates password hash on import, decrypts payload, verifies Zod schema structure, and offers atomic restore (clean wipe) or selective merge.

## Modular Feature Registry Architecture

To allow easy addition of future tools, every capability is implemented as a self-contained feature module under `src/modules/<module_name>/`:

```typescript
export interface AppModuleManifest {
  id: string
  title: string
  description: string
  icon: string
  route: string
  navOrder: number
  dashboardWidget?: React.ComponentType
  dbTableNames: string[]
}
```

Modules register their routes, dashboard widgets, and database table schemas via `src/modules/registry.ts`.

### Layout Structure

- RootLayout: Theme provider, toast notifications container, global keyboard shortcut listener.
- Responsive Navigation:
  - Desktop: Collapsible sidebar navigation with fast view switching and quick-add actions.
  - Mobile: Bottom bar navigation with active tab indicators and accessible touch zones.
- Main Modules:
  - HabitView: Daily and sub-day interval tracker, habit management modal, habit detail analytics panel.
  - TasksView: View toggle (List, Calendar, Kanban), project sidebar, task creation modal.
  - NotesView: Note card grid/list, split-pane markdown editor, search and tag filter bar.
  - SettingsView: Storage inspection, backup export/import, theme toggle, about page.

## Mobile and Capacitor Readiness

### Mobile Optimization Guidelines

- Touch Targets: Interactive controls must be sized at minimum 44px by 44px.
- Safe Area Insets: CSS variables `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` applied to container headers and navigation bars.
- Touch Gestures: Swipe actions for task completion and habit quick-check.
- Zero Remote Dependencies: All CSS, fonts, and assets bundled locally with zero CDN external fetches.

## Implementation Plan and Verification

### Project Setup Steps

- Initialize Vite project with React 18 and TypeScript template via pnpm.
- Configure Tailwind CSS, postcss, and shadcn/ui components.
- Set up Dexie.js database instance, repository layer, and TanStack Query client.
- Implement UI shell and navigation with responsive breakpoints.
- Build Habit Tracker, To-Do List, and Notepad modules incrementally.

### Testing Strategy

- Unit Tests: Vitest for state stores, streak calculation utilities, date parsing, and backup validation.
- Component Tests: React Testing Library for interactive component behavior.
- Storage Tests: Fake IndexedDB test harness for database operations.
