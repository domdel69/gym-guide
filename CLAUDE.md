# Gym Guide – guide for Claude Code

Personal workout PWA for one user (Dominique, French fr-CH UI, exercise names in English with French second). Hosted on GitHub Pages from this public repo, installed on an iPhone home screen. Plain vanilla JS, no build step, no framework. Current version: see `version.js`. Per-version history: `CHANGELOG.md`. Release commits and rollback: `README.md`.

## Source of truth
The programme (what exercises, sets, reps, rests) lives in the user's private plan file `Fitness/Fitness Programme.md` (OneDrive, Jarvis folder), not in this repo. Change the plan there first, then mirror it in `data-ex.js` and `data-sessions.js`. Sections 0 (status), 7 (app), 8 (decisions log) and 9 (session log) of that file are updated at the end of every session.

## Public repo rules (hard)
- No medical specifics (no injuries, clinician names, side of a body part; use generic words) and no body measurements. The repo is public.
- Logs and settings stay on the phone (localStorage); never commit user data.
- Exercise ids are permanent. Log format changes by addition only. Renames go in `ALIASES` (`data-ex.js`). `node tools/check_data.js` enforces this against `tools/released-ids.json`. Details in README.

## File map
- `index.html`, `styles.css`, `manifest.webmanifest`, `icons/`, `img/stretch/*.jpg` (public-domain photos, credit in `img/README.md`).
- `app.js` (state, events via `data-act` delegation, timers, sound), `views.js` (render functions), `store.js` (localStorage log, settings, migration, export/import), `data-ex.js` (EX, ALIASES, STRETCH), `data-sessions.js` (SESSIONS: A, B, C, home; stations, sets, reps, rest, `alt`, `stretch` ids, Guides tabs), `version.js`.
- `sw.js`: service worker; bump `VERSION` on every release or phones keep the old cache; precache list includes images.
- `tools/`: `check_data.js` (+ `released-ids.json`, `--update`), `dump.js`, `make_pdfs.py` (4 A4 landscape PDFs into `print/`), `archive.py` (copies a release into `releases/<v>/`).

## Design decisions to keep
- Direction B, gym-first: Accueil = hero card for the suggested session + Monday–Sunday strip + 12-segment programme bar (gym sessions per programme week from `settings.start`, full = 2, half = 1). Suivi = 4 tiles then charts per exercise (volume, estimated 1RM, load, reps; records need 2+ sessions). Réglages folds: Application, Programme, Séance, Sauvegarde, Vidéos, À imprimer.
- Layout (0.26): `body{position:fixed}` to the screen edges, `#app` is the only scroller, `#timer` and the tab bar are flex children (timer before `<nav>` in the DOM). `--vvt/--vvb` come from visualViewport only while the keyboard is open (innerHeight − vv.height > 120); `.kb` hides the tab bar while typing; use `toTop()` not window scroll. Do not size the body by `visualViewport.height` (left a gap under the tab bar on iPhone).
- Timers: `startTimer(sec,label,mode)` modes rest/hold/cd; `armTimer()` fires at the exact end; `LATE=2500` ms: never beep late (a beep queued on a suspended AudioContext used to fire at the start of the next set). iOS suspends the page when the screen locks, so no sound then; a silent keep-alive audio was rejected because it would pause his music. Sound modes: prioritaire (WAV through `<audio>`, default) and mélangé (Web Audio).
- Countdown: ▶ per set on `kind:'time'` (side plank, default 45 s, min 5 s); "Minuteur" card (±30 s, `Store.durSet`) on `kind:'tick'` exercises with a duration such as "4 min".
- Stretches: last virtual station (index = stations.length) per session, max 5 ids from `SESSIONS[].stretch`, photos (two frames alternate), EN name first, ticks in `d.str[date][session]`, not in Suivi. No calf stretching in the programme for now (a pending clearance; do not state why in the repo).
- Notes: per exercise id, preview in the fold (lines joined by " · ", ellipsis). Swipe a session tile right to delete (recoverable via Sauvegarde > Annuler). Supersets: orange chip.
- "Versions précédentes" was removed from Réglages in 0.24; rollback is done by Claude from `releases/` or a release commit.

## Gotchas
- iOS sound, safe areas and keyboard viewport cannot be tested on desktop. Emulate with Playwright (iPhone 13, light and dark), then ask the user to confirm on the phone. Cause of "displaced tab bar" was inferred, never reproduced.
- After regex edits to `styles.css`, verify brace balance (a broken `@media` once disabled all later CSS).
- On the phone, update with Réglages > Forcer la mise à jour after a release.
- Log timestamps and filenames: Europe/Zurich.

## Release checklist (local terminal)
1. Edit; bump `version.js` and `sw.js` `VERSION`.
2. `node tools/check_data.js`, then `--update`.
3. `python3 tools/make_pdfs.py` (needs reportlab); `python3 tools/archive.py <v>`.
4. Commit, push main; add a row to the README table; optionally `git tag v<v> && git push --tags` (possible from a terminal).
5. Outside the repo, in the user's Jarvis folder: zip of the app as `Fitness/App Backups/YYYYMMDD - App - Gym Guide 0.x.zip`; copy the 4 PDFs to `Fitness/Printable Workouts/` (`Workout A - 0.x.pdf`, B, C, `Home Routine - 0.x.pdf`); zip the previous version's 4 PDFs into `Previous Versions/YYYYMMDD - Workouts - Gym Guide 0.x.zip`, test with `unzip -t`, then remove the loose old PDFs (the user's documented routine; otherwise never delete).
6. Update the plan file (sections 0, 7, 8, 9) and write a session log in `.cowork_logs/` (`YYYYMMDD_Session_Name_Log_vN.txt`, one line per action, `[YYYY-MM-DD HH:MM]`).

## Working rules (from the user's standing preferences)
- British spelling in English; French for the UI (fr-CH formats: 12'500, decimal comma in text). En dashes only, never em dashes or `--` in prose or files.
- Write non-ASCII files with a UTF-8-safe method (editor tools or Python), not shell heredoc, echo or printf.
- Keep a task list; lead with the answer; short replies. Ask one question before costly or ambiguous work. Never delete files unless instructed; copy before modifying; never work outside the pointed folder; never touch `_ARCHIVE` items.

## Backlog (user picks the order)
Logging depth: RPE per set, rest times editable per exercise. Block 2 of the programme (written at week 6 from the logs). Family B (home programme). Check decimal separator in charts against the fr-CH preference. Replace default YouTube ids that refuse embedding. Pending on-phone verification of 0.26: flush slim tab bar, no displacement after typing, beep exactly at the end of rests, countdowns, stretch photos, week bar.
