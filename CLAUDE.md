# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Angular 17 SSR frontend for the GameJamPlus (GJP) competition platform. The backend is a separate repository and must be running on `environment.apiUrl` (default `http://localhost:3000`) for the app to work.

## Rules

- **Never read or modify `.env` files.** If a change is needed, ask for permission first.

## Commands

```bash
npm start            # ng serve — dev server at http://localhost:4200
npm run build        # production build to dist/gj-platform
npm run watch        # development build, --watch
npm test             # ng test — Karma + Jasmine

npm run serve:ssr:GJ-Platform   # serve the built SSR bundle (Express, port 4000)
```

Run a single test file: `ng test --include="src/app/services/user.service.spec.ts"`. Karma launches Chrome by default.

## Architecture

### Standalone components, no NgModule
There is no `app.module.ts`. Bootstrapping goes through `src/app/app.config.ts` with `provideRouter`, `provideClientHydration`, `provideAnimationsAsync`, and `provideTranslateHttpLoader`. Every component is `standalone: true` and imports its own dependencies. New components must follow this pattern — don't introduce NgModules.

### SSR + browser dual rendering
The app runs in both Node (SSR via `server.ts` + `src/main.server.ts`) and the browser. **Anything that touches `window`, `document`, `localStorage`, or `navigator` must be guarded with `isPlatformBrowser(this.platformId)`** (see `app.component.ts` for the canonical pattern). Code that runs unconditionally in a constructor will execute on the server and break hydration.

### Routing
All routes live in `src/app/app.routes.ts`. The root path redirects to `/login`. The platform has role-based home pages routed by URL (not by guards): `/Jammer`, `/Juez`, `/home`. The "global" admin views (`global-home`, `global-jam`, `global-cruds/*`) and "local" organizer views (`local-home`) are separate component trees rather than separate routes — role-based UI selection happens inside those components.

### API layer
- Every backend call goes through a service in `src/app/services/*.service.ts`.
- Services build URLs from `environment.apiUrl` and return RxJS `Observable`s, typically unwrapping `response.data` via `map`.
- Auth is **cookie-session based**: requests that need the session pass `{ withCredentials: true }`. Don't introduce token headers without checking with the backend.
- **Components import `environment.prod` directly** (e.g. `import { environment } from '../../environments/environment.prod'`). There is no `environment.ts` — the prod file is the only one and is edited manually to switch API targets. Treat this as the established convention; don't "fix" it without a reason.

### Domain model
`src/types.ts` is the single source of truth for shared types and is imported across components. The competition pipeline drives most of the UI:

```
Pre-production → Register → GameJam → GameJam Submission →
Incubation → Incubation Submission → Incubation Evaluation →
Continental Semifinal → Acceleration → Acceleration Submission →
Acceleration Evaluation → Global Final
```

The `Submission` interface duplicates fields per stage (`gamejam*`, `incubation*`, `acceleration*`, plus `*Pitch*` variants). This is intentional — each stage records its own snapshot. When adding a new submission field, add it to all three stage groups unless the requirement is genuinely stage-specific.

### i18n
Translations are JSON files in `src/assets/i18n/` for `en-US`, `es-MX`, `pt-BR`, `zh-CN`. Loading is wired via `provideTranslateHttpLoader` in `app.config.ts`. Language detection happens once in `app.component.ts#ngOnInit` from the browser locale, with a fallback chain (exact culture → language prefix → `en-US`). When adding user-facing strings, add the key to **all four** files — missing keys fall back silently to English and break the experience for the other locales.

### UI stack
Angular Material (indigo-pink prebuilt theme) + Bootstrap 5 + FontAwesome (free-solid + free-brands + free-regular) coexist. TinyMCE and ngx-quill are both loaded for rich text in different forms. jsPDF + jspdf-autotable + file-saver are used for client-side report exports (see submission/team CRUDs).

## Folder layout (key entries)

```
src/app/
  app.routes.ts, app.config.ts, app.component.ts   # bootstrap
  services/                                         # one file per backend resource
  global-cruds/{user,team,site,region,gamejam}-crud # admin CRUD screens
  global-home/, global-jam/, local-home/            # organizer dashboards
  jammer-home/, juez-main/                          # role-specific home pages
  side-bar/, messages/, chat-window/                # shared UI building blocks
  upload-csv/                                       # bulk import flow
src/types.ts                                        # shared domain types + JamStage enum
src/environments/environment.prod.ts                # apiUrl lives here
server.ts, src/main.server.ts                       # SSR entry
```
