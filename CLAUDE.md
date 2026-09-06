# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A single-page Svelte app that checks if a Friends episode originally aired on today's date.
Live at shouldiwatchfriends.today. Deployed to GitHub Pages via GitHub Actions on push to `master`.

## Commands

- `bun install` -- install dependencies
- `bun run dev` -- start dev server (with `--host` for network access)
- `bun run build` -- production build to `dist/`
- `bun run preview` -- preview production build

No test suite or linter is configured.

## Architecture

Svelte 4 + Vite 5, SCSS for styles. No router, no state management library -- single page app.

- `src/main.js` -- entry point, mounts `App.svelte` into `#app`
- `src/App.svelte` -- all app logic: filters episodes by today's date, finds next upcoming episode anniversary, random episode picker via slot machine animation
- `src/SlotMachine.svelte` -- animated random episode selector with decelerating timeout schedule, exposes `start()`/`stop()` methods
- `src/FriendsTitle.svelte` -- renders the "F.R.I.E.N.D.S" logo with colored dots (scoped styles)
- `src/episodes.json` -- nested array of all episodes with date, title, desc, season, episode fields
- `src/style.scss` -- global styles, font-face declarations, light/dark theme via `light-dark()` CSS function

Path alias: `@` maps to `src/` (configured in `vite.config.js`).

Fonts in `public/`: `friends.ttf` (logo font) and `InterVariable.woff2` (body text).
