# Local Productivity Suite

A privacy-first, client-side, offline-capable productivity suite built with React 18, TypeScript, Tailwind CSS, and Dexie.js (IndexedDB).

## Features

- **Habit Tracker**: Track habits with daily, custom weekday, weekly target, and sub-day interval routines. Supports boolean checkboxes, numeric counters with target units, and timers. Includes streak calculations, best streaks, 30-day consistency scores, and Recharts completion trends and monthly heatmaps.
- **To-Do List & Task Management**: Manage projects, tasks, and inline subtask checklists. Supports List view with smart grouping (Overdue, Today, Tomorrow, Upcoming, Completed), Month/Week Calendar view, and 4-column drag-and-drop Kanban board.
- **Notepad**: Author Markdown notes with live split-pane preview, formatting toolbar, pinned notes, color labeling, tag filtering, word count and reading time statistics, single note `.md` export, and bulk `.zip` download.
- **Unified Dashboard**: Aggregates daily productivity scores, today's actionable habits, urgent tasks, and recent notes.
- **Command Palette**: Global `Cmd/Ctrl+K` shortcut to quickly search across all entities and trigger fast actions from any screen.
- **Data Privacy & Backup**: 100% client-side persistence in IndexedDB with zero remote tracking. Features versioned JSON backup export and Zod-validated restore (Replace All or Merge).
- **Mobile & Capacitor Ready**: Touch-optimized interface with minimum 44px hit areas, safe-area insets, and local notification service abstraction.

## Technology Stack

- **Framework**: React 18 with TypeScript 5 (strict mode)
- **Bundler**: Vite
- **Styling**: Tailwind CSS with CSS Variables for Light / Dark / System themes
- **Local Storage**: Dexie.js (IndexedDB) with repository pattern
- **State Management**: TanStack Query and Zustand
- **Visual Analytics**: Recharts
- **Icons**: Lucide React
- **Packaging**: Capacitor Android configuration

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (or npm)

### Installation

```bash
pnpm install
```

### Development Server

```bash
pnpm dev
```

### Running Tests

```bash
pnpm test
```

### Production Build

```bash
pnpm build
```

## Project Structure

- `src/core/db`: Dexie database schema and database instance
- `src/core/modules`: Modular feature registry for dynamic tool registration
- `src/core/theme`: Theme provider supporting light, dark, and system modes
- `src/core/backup`: Versioned JSON backup serialization, Zod validation, and restore engine
- `src/core/notifications`: Local notification service abstraction
- `src/modules/dashboard`: Unified dashboard view and productivity scoring
- `src/modules/habits`: Habit tracker domain, interval calculator, streak engine, and charts
- `src/modules/tasks`: Tasks, subtasks, projects, list, calendar, and Kanban views
- `src/modules/notes`: Markdown editor, parser, statistics, and zip exporter
- `src/modules/settings`: Storage diagnostics, backup management, and preferences
- `src/components/layout`: Responsive AppShell, Sidebar, Header, and BottomNav
- `src/components/ui`: Reusable UI component primitives
