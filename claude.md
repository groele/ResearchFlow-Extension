# ScholarFlow - Project Context

## Goal
Academic research productivity Chrome extension for physics/materials-science workflows. Capture literature, manage projects, track submissions, and sync across private clouds.

## Tech Stack
- **Frontend**: React 19 + TypeScript 5.9 (strict mode)
- **Extension Framework**: WXT 0.20 (Chrome MV3)
- **Styling**: Tailwind CSS 3.4 + CSS custom properties (teal primary palette)
- **Database**: IndexedDB via Dexie 4.0 (8 tables: projects, researchRecords, manuscripts, submissions, tasks, researchAreas, evidence, schemaTemplates)
- **State**: dexie-react-hooks (reactive queries), Zustand (UI state)
- **Validation**: Zod 3.24 (entity schemas)
- **Icons**: lucide-react
- **Components**: class-variance-authority (CVA) for variant management
- **Package Manager**: npm
- **Test Framework**: Vitest 3.0

## Architecture
- **entrypoints/**: WXT entry points (background, content, popup, sidepanel, options)
- **src/ui/**: Design tokens, theme CSS, shared component library (primitives, layout, domain)
- **src/features/**: Feature modules (dashboard, projects, records, kanban, timeline, settings, capture, copilot)
- **src/hooks/**: Shared custom hooks
- **src/storage/**: Dexie DB, Zod schemas, sync engine, settings
- **src/core/**: AI client, journal metadata scrapers
- **src/messaging/**: Chrome extension message bus

## Development Rules
- Do not change public APIs without explaining migration.
- Prefer small, reviewable commits.
- Always run tests after modifying logic.
- Keep UI clean, minimal, and scientific.
- Use the shared component library (src/ui/components/) for all UI.
- Use generateId() from src/storage/id.ts for all ID generation.
- Use Zod schemas from src/storage/schemas.ts for data validation.

## Code Style
- TypeScript strict mode.
- Prefer pure functions for data processing.
- Use descriptive variable names.
- Add tests for bug fixes.
- Use CVA for component variants.
- Use Tailwind utility classes + design tokens.

## Important Commands
```bash
npm install
npx wxt          # dev mode
npx wxt build    # production build
npm test         # run tests
npx tsc --noEmit # type check
```
