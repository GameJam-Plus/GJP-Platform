# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the server

There are no npm scripts beyond a stub `test`. Run the server directly:

```bash
node index.js          # production-like
npx nodemon index.js   # auto-reload during development (nodemon is a dep)
```

The server listens on port **3000**. MongoDB is hardcoded to `mongodb://127.0.0.1:27017/GameJamDB` in `index.js` — changing host/port requires editing the file. A local `mongod` must be running.

After first start, hit `GET /install` once to seed the initial `GlobalOrganizer` admin from `process.env.ADMIN_EMAIL`. Subsequent calls report "already installed".

## Required environment (`.env`)

| Var | Purpose |
| --- | --- |
| `TARGET` | `DEV` enables CORS for `localhost:4200` plus the production server IP listed in `index.js` and exposes the dev login backdoor (`POST /api/user/get-link` logs the magic-link URL to stdout). `PROD` serves the static Angular bundle from `dist/gj-platform/browser` and pipes stdout/stderr to `platform.log`. |
| `URL` | Public base URL — used to build magic-link redirects. |
| `EMAIL` | From-address for outgoing mail. |
| `EMAILPASSWORD` | **Resend API key** (despite the name) for `sendEmail` via Resend; also used as the SMTP password for `sendScore` via Office365 (`smtp.office365.com:587`). |
| `ADMIN_EMAIL` | Used only by `GET /install` to create the bootstrap admin user. |

## Architecture

Classic Express MVC layout, one folder per layer; every domain follows the same triad:

```
routes/<x>Route.js  →  controllers/<x>Controller.js  →  models/<x>Model.js (Mongoose)
```

`index.js` mounts each route under `/api/<resource>` and is the only place new resources are wired in. When adding a domain, create the matching model + controller + route file and register the route in `index.js` — there is no auto-discovery.

### Auth

- JWT-based, stored in an **`token` cookie** (httpOnly: false). The signing secret is currently a hardcoded string in the controllers (every `jwt.sign` / `jwt.verify` call uses the same literal) — this should be moved to an env var; treat the existing value as compromised. There is no central auth middleware; each controller that needs auth reads `req.cookies.token`, verifies it, then loads the user and checks `user.roles`.
- Role strings used throughout: `GlobalOrganizer`, `LocalOrganizer`, `Judge`, `Jammer`. Role checks are inline `user.roles.includes('GlobalOrganizer')` in controllers — no role helper.
- Login is passwordless: `POST /api/user/login-user` emails a magic link → `GET /api/user/magic-link/:token` sets the cookie and 302-redirects to `${URL}/home`.

### Data model conventions

- **Embedded denormalization** is the norm. `User` stores `region`, `site`, `team` as `{ _id, name }` subdocs; `Team.jammers` embeds `{ _id, name, email, discordUsername, role }`; `Jam` embeds full `themes`, `categories`, and `stages` arrays. When updating a user's name/email, controllers fan out updates to the embedded copies (see `updateUser` in `controllers/userController.js` updating `Team.jammers`). Keep this dual-write pattern in mind whenever you change a referenced field.
- Two distinct "jam" entities exist: **`GameJam`** (`models/gameJamEventModel.js`, the per-edition event) and **`Jam`** (`models/jamModel.js`, the configurable jam template with stages/themes/categories). Don't conflate them — controllers/routes are split (`/api/game-jam` vs `/api/jam`).
- `creatorUser` / `lastUpdateUser` audit subdocs (`{ userId, name, email }` + dates) appear on most models and are filled by controllers, not middleware.
- I18n on content models is via parallel fields: `titlePT`/`titleES`/`titleEN`, `descriptionPT`/`...ES`/`...EN`, `manualPT`/`...ES`/`...EN`. Same pattern for notifications.

### Multipart / form data

All routes use `multer` with `memoryStorage()`. Most routes that accept form fields but no files pass `upload.none()` — preserve this when adding endpoints that take `multipart/form-data` from the frontend.

### Email

`services/mailer.js` exports two functions that use **different transports**:
- `sendEmail` — Resend SDK, used for magic-link and generic notifications.
- `sendScore` — Nodemailer over Office365 SMTP, used for evaluation result emails.

Both render `services/*.html` templates with a simple `{{token}}` replacer (`replaceTokens`). When adding a templated email, follow the same `fs.promises.readFile` + `replaceTokens` flow.

### Scheduled jobs

A `node-cron` job at the bottom of `index.js` runs daily at `0 0 * * *` in `America/Costa_Rica`. It walks every `GameJam`, finds a stage whose `endDateEvaluation` matches today, averages each submission's per-evaluator numeric criteria, writes `evaluationScore`, and emails every team member their score via `sendScore`. Any change to evaluation scoring or stage date semantics must keep this job consistent.

### Frontend serving (PROD only)

In `TARGET=PROD`, the Angular build at `dist/gj-platform/browser` is served as static files, with a catch-all that falls back to `index.html` for SPA routes. Per `README.md`, the bundled `dist/.../main-[hash].js` has a hardcoded `localhost` that must be hand-replaced with the deploy host — there is no rebuild step in this repo.
