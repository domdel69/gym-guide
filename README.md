# Gym Guide

Personal gym programme web app (PWA, French UI). Hosted on GitHub Pages, logs stay on the phone.

## Files
- `data-ex.js`, `data-sessions.js`: all content (exercises, sessions, guides). Edit these to change the plan.
- Stretches (0.25, photos from 0.26): `window.STRETCH` in `data-sessions.js` (EN and FR names, hold time, muscle zone); photos in `img/stretch/<id>-0.jpg` and `-1.jpg` (Free Exercise DB, public domain, see `img/README.md`; precached in `sw.js`, copied by `archive.py`); each session lists up to 5 ids in `stretch`. They form a last virtual station (index = number of stations) shown as tiles; ticks are stored in `d.str[date][session]`. Not in the Suivi, not in `EX`.
- Timers (0.26): `startTimer(sec,label,mode)` with mode rest, hold (stretch, side plank sets) or cd (elliptical, bike); the beep fires from a timeout at the exact end and is never played more than 2.5 s late (iOS suspends the page when the screen locks; a beep scheduled on a suspended Web Audio context used to play at the next tap).
- Layout (0.26, bottom band 0.28): the page never scrolls (`body` fixed at the window height, follows the visual viewport only while the keyboard is open). On the iPhone 11 in app mode iOS paints a band of about 48 px below the web view in the manifest `background_color`; `html.shortvp` then gives the tab bar the same colour so both read as one block.; `#app` is the scroller; the rest timer and the tab bar are normal flex children, so nothing is `position:fixed`.
- `app.js`, `views.js`, `store.js`, `styles.css`: app code. `sw.js`: offline cache.
- `version.js`: `APP_VERSION` and `RELEASES` (archived versions). `VERSION` in `sw.js`: bump both on each release (0.1, 0.2, ...).
- `tools/make_pdfs.py`: regenerates `print/*.pdf` from the data files (needs node, playwright).
- `tools/check_data.js`, `tools/released-ids.json`: log consistency check (see below).
- Programme tracking: start date in `settings.start`, measurements in `checks` (phone only, added to the log format); week counter, deload banner and 6-week reminder are computed in `app.js` (`PHASE`, `weekOf`, `nextCheck`).
- `tools/archive.py`, `releases/`: static copies of past versions.

## Release steps
1. Edit data/code. Bump `APP_VERSION` in `version.js` and `VERSION` in `sw.js`.
2. `node tools/check_data.js` must pass. Then `node tools/check_data.js --update` (records the exercise ids as released).
3. `python3 tools/make_pdfs.py`.
4. `python3 tools/archive.py <version>` (copies the release to `releases/<version>/` and lists it in `version.js`).
5. Commit on a branch and open a pull request (no direct pushes to main). After the merge, add the merge commit to the table below (tags cannot be pushed from Claude's session; create `v<version>` tags from a terminal if wanted).

## Keeping the log consistent when the programme changes
The phone log is `log[date][sessionId][exerciseId] = [{reps, kg, done, t}]`, plus `meta` (name and type snapshot per exercise and session). Rules:
- Exercise ids are permanent. A variation with a different movement gets a new id. Never reuse an id for another movement.
- Alternatives for a station: `alt:[{ex:'id', reps:'…'}]` on a session item (see `ALT_*` in `data-sessions.js`). Every alternative is a normal exercise with its own permanent id; the choice per date is stored in `pick[date][session][planned id]`, sets are logged under the chosen id. Listed on the PDFs ("Ou :") and as chips in the app.
- Rename or merge an exercise: keep the new id and add `oldId:'newId'` to `window.ALIASES` in `data-ex.js`. The log, the video override and the Suivi history are migrated at startup, after a safety copy (`preMigration`).
- Retire an exercise: remove it from the sessions only; keep it in `EX` (or alias it). Its history stays in the Suivi under "Anciens exercices".
- Do not change an exercise `kind` (lift, assist, reps, tick) once released.
- The log format only changes by addition, so an older version of the app can still read it.
`node tools/check_data.js` enforces these rules against `tools/released-ids.json`.
Suivi excludes warm-up stations (items with `warm:true` in the sessions, placed at the start of A, B and C) and every exercise of kind `tick`.

## Rollback
- From the phone: removed in 0.24 (no "Versions précédentes" section in Réglages). Archived copies stay reachable at `releases/<version>/` on the site; to restore one, ask Claude.
- Permanent rollback (needs Claude or a terminal): restore the release commit (table below) as a new commit, so Pages redeploys:
  `git checkout f035aa9 -- . && sed -i "s/gym-guide-0.7/gym-guide-0.7-r1/" sw.js && git commit -am "Roll back to 0.7" && git push`
  (a new cache name makes phones refetch; `releases/` and `tools/` are restored too, so re-run `archive.py` afterwards if the listing is wrong).
- Data: Réglages > Sauvegarde > Exporter before any release. The app keeps one automatic safety copy before an import or a clear ("Annuler").

## Releases
| Version | Commit | Archive |
| --- | --- | --- |
| 0.26 | 6c0ec35 | `releases/0.26/` |
| 0.27 | c94260a | `releases/0.27/` |
| 0.25 | ef4dabb | `releases/0.25/` |
| 0.24 | 3e3214e | `releases/0.24/` |
| 0.23 | 324130e | `releases/0.23/` |
| 0.22 | 2c55895 | `releases/0.22/` |
| 0.21 | 4c18208 | `releases/0.21/` |
| 0.20 | d7aa7b7 | `releases/0.20/` |
| 0.19 | da7c820 | `releases/0.19/` |
| 0.18 | 14d8368 | `releases/0.18/` |
| 0.17 | b701982 | `releases/0.17/` |
| 0.16 | b953dad | `releases/0.16/` |
| 0.15 | 005d098 | `releases/0.15/` |
| 0.14 | b84b161 | `releases/0.14/` |
| 0.13 | 7ffcc47 | `releases/0.13/` |
| 0.12 | a688b88 | `releases/0.12/` |
| 0.11 | 835b318 | `releases/0.11/` |
| 0.10 | 449dfb4 | `releases/0.10/` |
| 0.9 | 105a9e1 | `releases/0.9/` |
| 0.8 | eddde6c | `releases/0.8/` |
| 0.7 | f035aa9 | `releases/0.7/` |
