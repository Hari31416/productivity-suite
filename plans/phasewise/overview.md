# Phase-Wise Implementation Roadmap

## Overview

This roadmap defines the sequential, modular implementation plan for the Local Productivity Suite. Each phase is designed to produce a fully functional, testable milestone while maintaining strict modular separation so new tools can be added at any time.

## Phase Directory

- Phase 1: [phase-1-foundation-and-architecture.md](phase-1-foundation-and-architecture.md)
  - Core setup, Vite, React 18, TypeScript 5, Tailwind CSS, shadcn/ui.
  - Dexie.js IndexedDB schema and repository abstraction.
  - Modular Feature Registry architecture.
  - Responsive shell navigation (Desktop sidebar and Mobile bottom navigation).
  - Theme provider (light, dark, system).
- Phase 2: [phase-2-habit-tracker.md](phase-2-habit-tracker.md)
  - Habit tracking domain models and schema.
  - Daily check-ins and sub-day interval tracking (e.g., every 3 hours, multi-time daily logging).
  - Streak, completion rate, and aggregate score algorithms.
  - Interactive grid tracker, Recharts visual analytics, and monthly consistency heatmaps.
- Phase 3: [phase-3-todo-tasks.md](phase-3-todo-tasks.md)
  - Hierarchical project, task, and subtask architecture.
  - Multiple task layouts: List/Grouped view, Calendar view, and Kanban board.
  - Priority levels, due dates/times, tags, and inline subtask checklist management.
  - Filter, search, and sorting pipelines.
- Phase 4: [phase-4-notepad.md](phase-4-notepad.md)
  - Markdown note-taking engine with live split-pane preview and syntax styling.
  - Note organization via tags, project links, and pinned notes.
  - Full-text instant client-side search and word/reading-time statistics.
  - Single note and bulk Markdown export.
- Phase 5: [phase-5-dashboard-and-security.md](phase-5-dashboard-and-security.md)
  - Unified Dashboard home view aggregating daily habits, urgent tasks, and recent notes.
  - Versioned JSON export/import with overwrite or merge restore.
  - Storage diagnostics and settings management.
- Phase 6: [phase-6-mobile-capacitor-polish.md](phase-6-mobile-capacitor-polish.md)
  - Capacitor Android configuration and mobile web optimizations.
  - Touch target sizing (44px min), swipe gestures, and safe area insets.
  - In-app notification triggers and Web Notification API integration.
  - Comprehensive unit and integration test suite with Vitest.

## Dependency and Execution Order

```text
Phase 1 (Foundation, DB, Module Registry, Responsive Shell)
   |
   +---> Phase 2 (Habit Tracker Module)
   |
   +---> Phase 3 (To-Do & Calendar Module)
   |
   +---> Phase 4 (Notepad Module)
   |
   +---> Phase 5 (Unified Dashboard, JSON Backup/Restore)
   |
   +---> Phase 6 (Mobile & Capacitor Polish, Testing & Verification)
```
