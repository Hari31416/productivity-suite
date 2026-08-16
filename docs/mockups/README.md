# Android-First Productivity Suite UI Redesign

## 1. Overall Direction

Redesign the application as a **mobile-first productivity app with an Android-native feel**, while retaining a polished responsive desktop experience.

The redesign should not simply shrink the existing desktop UI. The underlying information architecture should be adapted so that mobile is the primary design target and desktop becomes an expanded presentation of the same architecture.

The visual language should feel like a modern Android productivity application: calm, spacious, touch-friendly, focused, and highly usable with one hand.

The existing teal/emerald brand should remain the primary visual identity.

Primary brand colors:

* Primary: `#0F9F82`
* Primary dark / pressed: `#087F6A`
* Primary light / subtle selected surface: `#DDF7F0`
* Accent: `#F4B942`
* Light background: `#F8FAF9`
* Dark background: `#0D1514`
* Primary text: `#17201E`

Use teal primarily for actions, active states, progress, selection and branding. Use amber sparingly for streaks, reminders, highlights and attention states.

The application should support both light and dark themes from the beginning. Components should not be designed only for light mode and subsequently inverted.

---

# 2. Core Design Principles

### Mobile first, not desktop responsive

Design every important screen for a small Android screen first.

Desktop layouts should be created by progressively expanding the mobile information architecture rather than taking the current desktop interface and hiding pieces of it.

The UI should work comfortably around a 360–430px wide viewport.

### Clarity over information density

The current application makes good use of available desktop space, but some screens expose too much information simultaneously.

On mobile:

* Show the most important information first.
* Hide secondary information until requested.
* Use progressive disclosure.
* Prefer one strong primary action per screen.
* Avoid displaying multiple competing toolbars.
* Avoid dense tables wherever possible.

### Thumb-friendly interaction

All interactive controls should have a minimum effective touch target of approximately **44–48px**.

This applies even when the visual icon itself is smaller.

Do not create tiny clickable checkboxes, kebab menus or filter controls merely because the desktop version can accommodate them.

### One-handed usage

Important actions should generally be reachable from the bottom half of the screen.

Creation and frequently repeated actions should use a FAB or bottom action area rather than requiring the user to reach the top-right corner.

### Native-feeling Android patterns

Use Android-style interaction patterns where appropriate:

* Bottom navigation
* Floating action button
* Bottom sheets
* Scrollable chips
* Segmented tabs
* Swipe actions
* Large touch targets
* Edge-to-edge layouts
* Safe-area handling
* Clear visual elevation
* Predictable back navigation

Do not attempt to imitate Android system UI literally. The application should feel native while retaining its own brand identity.

---

# 3. Navigation Architecture

Replace the current persistent desktop sidebar as the primary mobile navigation mechanism.

Mobile should use a persistent bottom navigation bar with:

* Home / Dashboard
* Habits
* Tasks
* Notes

A central FAB or prominent floating action should sit above the navigation area and provide the global creation flow.

Recommended structure:

`Home | Habits | + | Tasks | Notes`

The center `+` should open a bottom sheet containing:

* Add Task
* Add Habit
* Add Note

The FAB should be visually prominent but should not dominate the interface.

The bottom navigation should remain visible on primary screens but should not obstruct content or keyboard interaction.

Use:

`padding-bottom: env(safe-area-inset-bottom)`

and equivalent safe-area handling for the top edge where appropriate.

On desktop, the navigation can transform into a sidebar or compact top/side navigation if that provides better use of available space. However, the destinations and hierarchy should remain consistent.

---

# 4. Global App Shell

### Mobile

The standard mobile screen structure should generally be:

```text
Status / Safe Area
        ↓
Screen Header
        ↓
Optional Tabs / Filters
        ↓
Scrollable Content
        ↓
Bottom Navigation
```

Do not place large persistent desktop-style headers on every screen.

A mobile header should generally contain:

* Back button when necessary
* Screen title
* Optional short subtitle
* One or two contextual actions
* Search/menu icon where appropriate

Avoid putting 5–6 actions into a single header.

Secondary actions should move into a kebab menu or bottom sheet.

### Desktop

Desktop can expose additional controls horizontally, but the same hierarchy should remain.

For example, mobile may show:

`Search → Filter`

while desktop may show:

`Search | Priority | Status | Tags`

The functionality remains the same; only the presentation changes.

---

# 5. Global Creation Pattern

Avoid large inline creation forms whenever possible.

Instead, use:

**FAB → Bottom Sheet → Focused creation form**

Examples:

`+ → Add Task`

`+ → Add Habit`

`+ → Add Note`

The bottom sheet should support:

* Drag/swipe dismissal
* Keyboard-aware resizing
* Safe-area padding
* Large controls
* Clear primary action
* Minimal required fields initially

Advanced fields should be progressively disclosed.

For example, task creation should initially expose:

* Task title
* Due date
* Priority

Additional fields such as:

* Project
* Tags
* Reminder
* Notes
* Subtasks

can appear below or through an “More options” section.

---

# 6. Dashboard

The dashboard should become a genuinely mobile-friendly daily command center.

Recommended structure:

```text
Good morning, Harikesh
Sunday, Aug 16

[ Daily Progress ]
       84%
   5 / 6 completed

Today's Focus
[ Habit / Task ]
[ Habit / Task ]
[ Habit / Task ]

Upcoming
[ Task ]
[ Task ]

Recent Notes
[ Note ]
[ Note ]

Bottom Navigation
```

The existing large desktop hero banner should be simplified.

The daily score should remain prominent, preferably as a circular progress indicator.

The four desktop metric cards should become a responsive 2×2 grid on larger mobile screens or a horizontally scrollable set of compact cards when appropriate.

Do not force four large cards vertically onto a small screen.

Use compact cards for:

* Active habits
* Tasks remaining
* Notes
* Projects

The “Completed Today” section should be visually lightweight. It should not dominate the dashboard.

The dashboard should answer three questions immediately:

1. What have I accomplished?
2. What needs my attention now?
3. What should I do next?

---

# 7. Tasks

The current task experience relies heavily on desktop structures such as side filter panels, wide tables, multi-column layouts and desktop toolbars.

These should be replaced on mobile with a vertically organized task experience.

Recommended structure:

```text
Tasks                         Search ⋮

[ My Tasks ] [ Projects ]

[ Search tasks... ]

[All] [Today] [Upcoming] [Overdue]

Today · 2
────────────
[ Task card ]
[ Task card ]

Upcoming · 8
────────────
[ Task card ]
[ Task card ]

                  +
```

Task cards should contain:

* Completion control
* Task title
* Optional priority indicator
* Due date/time
* Project
* Important status/repeating indicator
* Overflow menu

Do not display every piece of metadata on every task.

Secondary information should be visually subordinate.

### Swipe actions

Where practical:

Swipe right:

`Complete`

Swipe left:

`Reschedule / Delete`

Do not make swipe the only way to perform an action. Every swipe action must also be available through visible controls or the task menu.

### Filters

Use horizontally scrollable chips:

`All | Today | Upcoming | Overdue`

More advanced filters should open a bottom sheet.

Do not reproduce the desktop filter sidebar on mobile.

---

# 8. Task Details

Task details should be a focused screen rather than a desktop form compressed into a phone.

Recommended hierarchy:

```text
← Task Details                     ⋮

☐ Prepare quarterly review slides

[ In Progress ]

Due
Aug 18 · 3:00 PM

Project
Work Project

Priority
Medium

Subtasks
2 / 4 completed
────────────
✓ Research
✓ Outline
□ Design slides
□ Review

Notes
...

[ Edit Task ]
```

The completion action should remain easily accessible.

Editing should open a dedicated edit screen or bottom sheet depending on complexity.

Avoid exposing every configurable field simultaneously.

---

# 9. Calendar

The desktop month calendar should not simply be scaled down.

For mobile:

* Provide Month / Week / Day tabs.
* Use a compact date selector.
* Prefer a 7-day horizontal date strip for day-level interaction.
* Use the calendar primarily for navigation.
* Show actual tasks in a vertical timeline/list below.

A good mobile day view:

```text
←   Aug 16, 2026   →

Sun 16

09:00
[ Task ]

12:00
[ Task ]

15:00
[ Task ]

18:00
[ Task ]

                         +
```

Month view can remain available for date navigation but should not attempt to display large numbers of task cards inside tiny calendar cells.

---

# 10. Kanban

The four-column desktop Kanban board should become horizontally scrollable on mobile.

Do not stack all columns vertically if that makes board navigation cumbersome.

Use:

```text
[ To Do ] → [ In Progress ] → [ Blocked ] → [ Done ]
```

Each column should occupy most of the viewport width.

The user can swipe horizontally between columns.

Cards should be compact but touch-friendly.

Drag-and-drop should remain supported where practical, but do not make precise drag-and-drop the only mechanism for changing status.

Provide a task menu with:

`Move to...`

as an accessible alternative.

---

# 11. Habits

Habits are one of the most important areas of the application and should feel particularly optimized for quick interaction.

Recommended structure:

```text
Habits                    Analytics ⋮

Daily    Week    Analytics

[ Mon ] [ Tue ] [ Wed ] [ Thu ] [ Fri ] [ Sat ] [ Sun ]

[All] [Health] [Productivity] [Fitness] →

Today's Habits

[ Drink Water                 ✓ ]
  8 / 8 glasses
  ● ● ● ● ● ● ● ●

[ Read                         ✓ ]
  20 / 30 min

[ Exercise                     + ]
  30 min
```

Use a horizontal date strip instead of requiring users to interact with a full calendar.

The selected date should have a strong but subtle teal treatment.

Categories should be horizontally scrollable.

---

# 12. Habit Cards

Habit cards should support direct interaction.

For boolean habits:

Use a large circular or rounded check action.

For numeric habits:

Show:

`−  7 / 8  +`

For timers:

Show:

`Start`

or the active timer state.

Streak information should be visible but secondary.

For example:

`🔥 7 day streak`

Do not make every habit card visually heavy with multiple badges and statistics.

The most important question should always be:

**What do I need to do right now?**

---

# 13. Habit Details

Habit details should contain:

* Habit name
* Category
* Current progress
* Current streak
* Best streak
* Frequency
* Target
* Reminder
* Recent history
* Edit action

The screen should prioritize today's interaction over configuration.

Example:

```text
← Drink Water

8 / 8 glasses
████████████ 100%

🔥 7 day streak

[ − ]   8 / 8   [ + ]

Today
● ● ● ● ● ● ● ●

Recent History
...

[ Edit Habit ]
```

---

# 14. Habit Timer

The timer should be treated as a dedicated focused experience.

Use:

* Large circular progress indicator
* Large remaining time
* Pause / Resume
* Finish
* Reset

Avoid unnecessary navigation or metadata while the timer is running.

Example:

```text
← Focus Timer

Meditation

        15:00

      ◯────◯
       
[ Pause ]

Reset              Finish
```

The timer should work well with the screen remaining readable from a distance.

---

# 15. Habit History and Analytics

Avoid reproducing the desktop matrix on mobile.

Instead use:

* Compact heatmaps
* Sparklines
* Weekly summary cards
* Swipeable time periods
* Progress rings
* Simple trend charts

For example:

```text
30-Day Consistency
       78%

Completion Trend
╭────────╮
│   ╭─╮  │
│ ╭─╯ ╰──╯
╰────────╯

Best Streak
7 days

This Week
5.2 days average
```

Charts should remain touch-friendly.

Avoid requiring precise interaction with tiny chart points.

---

# 16. Notes

The Notes section should behave more like a mobile note-taking application than a desktop document manager.

Recommended structure:

```text
Notes                         Search ⋮

[ All ] [ Pinned ] [ Recent ]

[ Search notes... ]

Project Ideas
Updated today

Meeting Notes
Updated yesterday

Book Notes
Updated Aug 14

                       +
```

Use compact note cards/list rows.

Each note should expose:

* Title
* Short preview
* Last updated
* Optional tag
* Optional pinned indicator

Avoid displaying excessive metadata in the list.

---

# 17. Markdown Editor

The existing split-pane desktop editor should not be replicated literally on mobile.

On mobile, use:

`Edit | Preview`

as a segmented control/tab.

Default to Edit.

Preview should occupy the full content area.

Editor toolbar should be horizontally scrollable or organized into a compact secondary toolbar.

Do not squeeze editor and preview side-by-side on a phone.

Desktop can retain split-pane editing.

Mobile:

```text
← Project Ideas                 Save

[ Edit ] [ Preview ]

# Project Ideas

## AI Habit Coach

- Personalized suggestions
- Progress insights
- Smart reminders

────────────────
B I H ...
```

The keyboard should be handled carefully so the editor remains usable above the Android keyboard.

---

# 18. Quick Add

Quick Add should be one of the most important global interactions.

Pressing the central FAB should open a bottom sheet:

```text
Quick Add                              ×

＋  Task
○  Habit
▤  Note
```

Each option should immediately open the appropriate creation flow.

Do not open a large full-screen menu for this.

---

# 19. Search and Command Palette

The existing global `Cmd/Ctrl+K` command palette should remain.

On desktop:

`Cmd/Ctrl + K`

On mobile:

Use the search icon in the relevant header or a global search action.

The command palette/search experience should search across:

* Tasks
* Habits
* Notes
* Projects

Results should be grouped by entity type.

Mobile search should be full-screen or a dedicated search surface rather than a tiny desktop-style command box.

---

# 20. Filters and Secondary Controls

Do not allow every screen to accumulate visible filters.

Primary filters should be represented as horizontal chips.

Secondary filters should be placed in a bottom sheet.

Example:

```text
[All] [Today] [Upcoming] [Overdue] →

```

Tapping a filter icon can open:

```text
Filter Tasks

Status
○ All
○ To Do
○ In Progress
○ Done

Priority
□ Low
□ Medium
□ High

Project
...

              [Apply]
```

This keeps the main screen clean.

---

# 21. Visual Design

Continue using the current teal/emerald branding.

Primary:

`#0F9F82`

Primary dark:

`#087F6A`

Primary light:

`#DDF7F0`

Accent:

`#F4B942`

Light background:

`#F8FAF9`

Dark background:

`#0D1514`

Text:

`#17201E`

Use teal for:

* Primary buttons
* Active navigation
* Completion states
* Progress
* Selected tabs
* Focus states
* Brand elements

Use amber for:

* Streaks
* Reminders
* Important highlights
* Non-error attention states

Do not use teal and amber everywhere. Their value comes from being relatively sparse.

Other semantic colors such as red, blue and purple may remain for task priorities, categories and system states, but they should not compete with the primary brand.

---

# 22. Surfaces and Elevation

Move away from heavy desktop borders.

Prefer:

* Soft tinted surfaces
* Subtle elevation
* Light borders only when necessary
* Layered surfaces
* Moderate corner radius

Recommended radius scale:

* Small controls: `10–12px`
* Cards: `16px`
* Larger containers: `20px`
* Chips: `20–24px`
* FAB: approximately `28px` or circular

The UI should feel soft and tactile without becoming overly rounded or “bubble-like”.

---

# 23. Typography

Use a clean modern sans-serif such as:

* Inter
* Roboto

Roboto can reinforce the Android feel; Inter can provide a slightly more modern web-product feel.

Use a clear hierarchy rather than relying on font weight everywhere.

Screen titles should be prominent.

Metadata should be smaller and lower contrast.

Do not make every label bold.

---

# 24. Dark Mode

Dark mode should be designed independently rather than generated by simply changing the background color.

Recommended base:

`#0D1514`

Use slightly lighter tinted surfaces for cards and sheets.

Teal should remain visible without becoming excessively luminous.

The logo should have an appropriate dark-context variant.

Text should use warm/neutral light tones rather than pure white wherever possible.

Avoid excessive shadows in dark mode.

Use surface contrast instead.

---

# 25. Desktop Behaviour

The redesign must not destroy the existing desktop experience.

Desktop should take advantage of additional space through:

* Side navigation
* Multi-column layouts
* Wider calendars
* Split-pane Markdown editor
* Full Kanban board
* Expanded analytics
* Persistent filters where useful

However, the desktop implementation should share the same component hierarchy and interaction model as mobile.

Do not create completely separate application concepts for mobile and desktop.

Think of the system as:

**Mobile = focused information architecture**

**Desktop = expanded information architecture**

---

# 26. What NOT To Do

Do not simply scale the current desktop UI down.

Do not retain the persistent sidebar on small screens.

Do not reproduce wide desktop tables on mobile.

Do not put multiple dense toolbars above the content.

Do not expose every filter simultaneously.

Do not use tiny icon-only controls without adequate touch targets.

Do not make users reach the top-right corner for frequent actions.

Do not use full-screen forms for simple creation flows when a bottom sheet is sufficient.

Do not place Markdown editor and preview side-by-side on a phone.

Do not put a full month calendar at the center of every task interaction.

Do not make swipe gestures the only way to perform important actions.

Do not make drag-and-drop the only way to move Kanban tasks.

Do not overuse cards. Lists should remain lists when the content is repetitive.

Do not use excessive shadows, gradients or decorative effects.

Do not use the teal primary color for every icon, badge and status.

Do not sacrifice information hierarchy merely to make the interface look “mobile”.

Do not remove useful desktop functionality just to achieve mobile simplicity.

---

# 27. What TO Do

Prioritize the following:

1. Establish the new responsive app shell.
2. Implement mobile bottom navigation.
3. Implement the central Quick Add FAB.
4. Establish mobile screen/header patterns.
5. Establish bottom-sheet primitives.
6. Redesign Dashboard.
7. Redesign Tasks.
8. Redesign Habits.
9. Redesign Notes.
10. Adapt Calendar and Kanban.
11. Adapt analytics and charts.
12. Implement dark mode using the same design tokens.
13. Validate all flows on approximately 360px, 390px and 430px widths.
14. Validate desktop layouts after mobile changes.
15. Validate Android safe areas and keyboard behaviour.

---

# 28. Component Strategy

The redesign should create reusable primitives rather than implementing every screen independently.

Useful shared components include:

* `MobileAppShell`
* `BottomNavigation`
* `AppHeader`
* `FloatingActionButton`
* `QuickAddSheet`
* `BottomSheet`
* `SegmentedTabs`
* `ScrollableChipGroup`
* `MetricCard`
* `TaskCard`
* `HabitCard`
* `NoteCard`
* `ProgressRing`
* `ProgressBar`
* `DateStrip`
* `FilterSheet`
* `EntitySearch`
* `EmptyState`
* `SectionHeader`
* `SwipeableListItem`
* `MobileList`
* `MobileCalendar`
* `MobileTimeline`

These should consume the existing application data/state layer wherever possible.

The redesign should primarily change presentation and interaction architecture, not unnecessarily rewrite business logic.

---

# 29. Responsive Breakpoint Philosophy

Do not design around desktop breakpoints first.

Use a mobile base and progressively enhance.

Conceptually:

```text
Small phone
    ↓
Large phone
    ↓
Tablet
    ↓
Desktop
    ↓
Large desktop
```

At small widths:

* Single column
* Bottom navigation
* Bottom sheets
* Horizontal scrolling for secondary navigation
* Compact cards

At tablet widths:

* More content per screen
* Optional two-column layouts
* Expanded navigation

At desktop:

* Sidebar
* Multi-column dashboards
* Expanded calendars
* Full Kanban
* Split-pane notes

---

# 30. Implementation Philosophy

The most important goal is not to make the application look like a generic Material 3 app.

It should feel like **this application's own productivity system expressed through modern Android interaction patterns**.

Retain the distinctive teal/emerald identity and the `P + checkmark` brand.

Use Android patterns for interaction and ergonomics, but maintain a clean, restrained visual language.

The final product should feel:

**Calm · Fast · Focused · Personal · Productive · Private**

The user should be able to open the application on a phone and immediately understand:

* where they are,
* what needs attention,
* what they can accomplish now,
* and how to quickly add something.

The desktop version should then feel like the same product with more room to breathe, rather than a completely different application.
