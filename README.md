# PER1SAI Archive

Retro-style university archive frontend built with Vite and React. The public app is a desktop-inspired archive UI for browsing semesters, courses, materials, tasks, schedules, announcements, and an about page. The same repo also includes a custom admin panel backed by PocketBase.

## Stack

- Vite
- React 19
- React Router with `createHashRouter`
- PocketBase as backend CMS/auth/storage
- CSS-only retro UI with `VT323`

## Public Features

- Semester and course archive navigation
- Material listing for `teori` and `praktikum`
- Schedule page sourced from PocketBase and collapsed by class session
- Task board with `In Progress` and `Expired`
- Announcements feed
- About page
- Daily loading overlay shown once per day per browser via `localStorage`
- Retro 404 and route error pages

## Admin Features

- Admin auth using PocketBase `admins` collection
- Materials CRUD by semester -> course -> category
- Announcements CRUD
- Tasks CRUD
- Schedule grid editor
- Drag-and-drop schedule draft mode before save
- Site settings editor

## Project Structure

```text
src/
  assets/
    errors/
    loading/
  components/
  context/
  data/
  hooks/
  lib/
  pages/
```

Key files:

- [src/App.jsx](src/App.jsx): router setup
- [src/components/DesktopLayout.jsx](src/components/DesktopLayout.jsx): public app shell
- [src/data/archiveApi.js](src/data/archiveApi.js): public data layer with PocketBase + mock fallback
- [src/lib/pocketbase.js](src/lib/pocketbase.js): PocketBase client helpers
- [src/lib/adminAuth.js](src/lib/adminAuth.js): admin auth + admin API helpers

## Environment

Create a local `.env` file from `.env.example`.

```env
VITE_POCKETBASE_URL=https://your-pocketbase.example
```

Notes:

- `.env` is intentionally ignored by Git.
- `VITE_*` values are exposed to the browser bundle by Vite, so only put public client config here.
- If `VITE_POCKETBASE_URL` is missing, the public app falls back to `mockDb` for supported resources and the admin panel is disabled.

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## PocketBase Integration

The frontend expects these main collections:

- `semesters`
- `courses`
- `materials`
- `tasks`
- `schedule`
- `announcements`
- `site_settings`
- `admins`

Public pages read from PocketBase when configured. Some pages still keep safe mock fallback behavior when the backend is empty or unavailable.

Recommended rules:

- public `list/view` only for archive-facing collections
- admin-only `create/update/delete`
- never use PocketBase superuser credentials in the frontend

## Routing

This app uses `createHashRouter`, so it is suitable for static hosting without server-side rewrite rules.

Public examples:

- `#/`
- `#/semester/1`
- `#/tasks`
- `#/schedule`
- `#/announcements`
- `#/about`

Admin examples:

- `#/admin/login`
- `#/admin`
- `#/admin/materials`

## Static Deployment

Because routing is hash-based, the built app can be deployed to simple static hosting without custom route handling.

Typical flow:

```bash
npm run build
```

Then serve the `dist/` directory with any static web server.

## Notes

- The repo is open source-friendly: `.env` is not tracked.
- The public app is intentionally read-only.
- Admin management is done through the custom `/admin` UI, not the PocketBase dashboard.
