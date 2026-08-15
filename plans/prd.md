# Product Requirements Document - Local Productivity Suite

## Executive Summary

The Local Productivity Suite is a privacy-first, client-side web application designed to run entirely within the user's browser without requiring remote servers or external account creation. The application is optimized for desktop and mobile responsive workflows and architected for seamless future packaging into an Android application using Capacitor.

The initial release focuses on three foundational productivity tools:
- Habit Tracker with daily check-ins, streaks, and analytics
- To-Do List with hierarchical projects, tasks, subtasks, and calendar views
- Notepad with markdown support, tagging, and quick organization

## Goals and Non-Goals

### Goals

- Deliver a 100% offline-capable, client-side productivity experience.
- Provide responsive, touch-friendly UI for both desktop browsers and mobile web/Capacitor environments.
- Provide data sovereignty with local persistence, full JSON data export, and import capabilities.
- Ensure sub-millisecond interaction latency for core logging and task workflows.

### Non-Goals

- Cloud synchronization, user auth servers, or remote multi-device sync in the initial release.
- Real-time multi-user collaboration.
- Heavy backend dependencies or proprietary cloud storage connectors.

## Core Features and User Stories

### Habit Tracker

- Daily and Sub-Day Frequencies: Support daily, specific weekdays, weekly targets, and sub-day recurring intervals (e.g., every N hours, custom time windows, multi-time daily logging).
- Flexible Logging Types: Toggle completion per interval/day with binary (done/not done), numerical counter (e.g., glasses of water), or duration targets.
- Streak and Consistency Calculations: Current streak, longest streak, sub-day completion rates, and daily aggregate scores.
- Aggregation and Analytics: Visual monthly consistency heatmaps, completion rate charts over 7-day, 30-day, and custom time windows.
- Categorization and Colors: Group habits by categories (Health, Learning, Work, Fitness) with customizable color palettes.

### To-Do List and Task Management

- Hierarchical Structure: Organize work into Projects, Tasks, and Subtasks.
- Task Attributes: Title, description, due date, priority levels (Low, Medium, High, Urgent), estimated time, and tags.
- Multiple Views:
  - List / Grouped View: Grouped by project, due date (Today, Upcoming, Overdue), or priority.
  - Calendar View: Month, week, and day view showing scheduled tasks and deadlines.
  - Kanban Board View: Status columns (To Do, In Progress, Blocked, Done).
- Subtasks: Checklist items with completion state and quick inline addition.
- Filtering and Search: Instant client-side search by keyword, tag, project, or date range.

### Notepad

- Document Creation: Rich text or markdown-enabled note editor with preview.
- Organization: Tag-based labeling, project association, and folder/notebook grouping.
- Quick Features: Pinned notes, full-text search, auto-save on typing, word and character counters.
- Reading and Editing Modes: Clean reading mode and distraction-free editing canvas.

### Data Management and Settings

- Local Persistence: Persistent client-side database utilizing IndexedDB through Dexie.js.
- Compressed Encrypted Backup: Single-click export of complete suite data into a compressed archive encrypted with a user-defined master password (AES-GCM).
- Import and Decrypt: Restore backups with master password verification and conflict resolution options (overwrite or merge).
- Appearance and Customization: Light, dark, and system theme modes.

## User Experience and Design Requirements

- Design System: Modern, minimalist interface utilizing shadcn/ui components and Tailwind CSS.
- Mobile First Navigation: Bottom navigation bar on mobile viewports; collapsible sidebar on desktop viewports.
- Responsive Touch Targets: Minimum 44x44px touch targets for mobile usability in Capacitor.
- Keyboard Shortcuts: Quick action palette for power users (e.g., Cmd/Ctrl+K search, quick task creation).

## Release Milestones

- Phase 1: Project foundation, local storage layer, and navigation shell.
- Phase 2: Habit tracker module with analytics and heatmaps.
- Phase 3: To-Do list module with project hierarchy and calendar view.
- Phase 4: Notepad module with markdown editor and tagging.
- Phase 5: Backup/restore manager, performance polish, and Capacitor preparation.
