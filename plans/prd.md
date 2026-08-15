# Product Requirements Document - Local Productivity Suite

## Executive Summary

The Local Productivity Suite is a privacy-first, client-side web application that runs entirely in the browser. It does not require remote servers or accounts. The first product is a website. The architecture is also a fit for later packaging as an Android app with Capacitor.

The suite is ambitious by design. Features ship in sequential phases so each milestone is usable, but later phases are in scope, not optional extras to drop.

Initial tools:

- Habit Tracker with daily and sub-day logging, streaks, heatmaps, and analytics
- To-Do List with projects, tasks, subtasks, list, calendar, and Kanban views
- Notepad with Markdown authoring, organization, search, and export

New tools can be added later through a module registry without rewriting navigation or storage.

## Goals and Non-Goals

### Goals

- Deliver a fully offline, client-side productivity experience after the first load.
- Provide a responsive, touch-friendly UI for desktop browsers and mobile web, with Capacitor as a later packaging target.
- Keep data on the device: IndexedDB persistence, versioned JSON export/import, and restore with overwrite or merge.
- Support power-user workflows (command palette, keyboard shortcuts) and mobile workflows (bottom nav, 44px targets, swipe actions).
- Make adding a fourth tool a registry and schema migration change, not a rewrite.

### Non-Goals

- Cloud synchronization, accounts, or multi-device sync.
- Real-time multi-user collaboration.
- Remote storage connectors or a backend API.
- A plugin marketplace. New tools are first-party modules in this repo.
- Encrypted or password-protected backups. Revisit later if needed.

## Core Features and User Stories

### Habit Tracker

- Frequencies: daily, specific weekdays, weekly targets, times per day, and sub-day intervals (every N hours inside a time window).
- Logging types: boolean done/not done, numeric counters (for example glasses of water), and duration timers.
- Streaks and consistency: current streak, longest streak, sub-day completion rates, and daily aggregate scores, using the user's local calendar date.
- Analytics: monthly consistency heatmaps and completion charts for 7-day, 30-day, and custom ranges.
- Organization: categories (Health, Learning, Work, Fitness, custom) and color palettes.
- Archive rather than hard-delete by default so history stays intact.

### To-Do List and Task Management

- Hierarchy: Projects, Tasks, and Subtasks (subtasks are checklists, not infinitely nested trees).
- Task attributes: title, description, due date, due time, priority (Low, Medium, High, Urgent), estimated time, tags, and status.
- Views:
  - List / grouped: by project, due date (Overdue, Today, Upcoming), or priority.
  - Calendar: month, week, and day, showing scheduled tasks and deadlines.
  - Kanban: To Do, In Progress, Blocked, Done, with drag-and-drop.
- Subtasks: inline checklist with completion state and a progress meter on the parent task.
- Filtering and search: keyword, tag, project, and date range, all client-side.

### Notepad

- Authoring: TipTap-based Markdown editor with toolbar, split preview, reading mode, and distraction-free editing.
- Organization: tags, optional project association, pinned notes, and color labels.
- Workflow: autosave while typing, full-text search, word and character counts, estimated reading time.
- Export: single note as `.md` and bulk notes as a zip of Markdown files.

### Cross-Module Home and Power User Features

- Dashboard: today's habits, urgent and due tasks, recent and pinned notes, and a simple daily progress summary.
- Command palette (`Cmd/Ctrl+K`): search entities and jump to create task, log habit, or new note.
- Appearance: light, dark, and system theme.

### Data Management and Settings

- Local persistence in IndexedDB via Dexie.js.
- Request persistent storage (`navigator.storage.persist()`) so browsers are less likely to evict data.
- Versioned JSON export/import for inspection and recovery, with overwrite or merge on restore.
- Storage usage estimate and a reminder to export if persistence is not granted.
- Timezone: all "today" and streak logic uses a stored local timezone preference (default: browser timezone).

## User Experience and Design Requirements

- Design system: shadcn/ui and Tailwind CSS, modern and minimal.
- Navigation: collapsible sidebar on desktop; bottom bar on mobile.
- Touch: minimum 44x44px targets; safe-area insets for later Capacitor use.
- Keyboard: command palette and shortcuts for quick create and search.
- Accessibility: visible focus, theme contrast, and keyboard reachability for primary actions.
- First run: empty states with a short path to create the first habit, task, and note. Optional sample data is acceptable.

## Constraints and Risks

- Fully local means IndexedDB can still be cleared by the user or the browser. JSON export is the safety net.
- Backup files are readable JSON. Do not store secrets in notes or tasks if the export file might be shared.
- No network after first load: fonts, icons, and scripts are bundled. No CDNs.

## Release Milestones

Work proceeds phase by phase. Each phase is in scope.

- Phase 1: Foundation, Dexie schema, module registry, responsive shell.
- Phase 2: Habit tracker including sub-day intervals, numeric/timer logs, streaks, and analytics.
- Phase 3: To-do module including list, calendar (month/week/day), and Kanban.
- Phase 4: Notepad with TipTap Markdown, tags, search, and export.
- Phase 5: Dashboard, command palette, JSON backup/restore, settings.
- Phase 6: Mobile polish, Capacitor Android baseline, notifications, test hardening.
