# Gym Guide

Personal gym programme web app (PWA, French UI). Hosted on GitHub Pages, logs stay on the phone.

## Files
- `data-ex.js`, `data-sessions.js`: all content (exercises, sessions, guides). Edit these to change the plan.
- `app.js`, `views.js`, `store.js`, `styles.css`: app code. `sw.js`: offline cache.
- `version.js`: `APP_VERSION` and `RELEASES` (archived versions). `VERSION` in `sw.js`: bump both on each release (0.1, 0.2, ...).
- `tools/make_pdfs.py`: regenerates `print/*.pdf` from the data files (needs node, playwright).
- `tools/check_data.js`, `tools/released-ids.json`: log consistency check (see below).
- `tools/archive.py`, `releases/`: static copies of past versions.

## Release steps
1. Edit data/code. Bump `APP_VERSION` in `version.js` and `VERSION` in `sw.js`.
2. `node tools/check_data.js` must pass. Then `node tools/check_data.js --update` (records the exercise ids as released).
3. `python3 tools/make_pdfs.py`.
4. `python3 tools/archive.py <version>` (copies the release to `releases/<version>/` and lists it in `version.js`).
5. Commit and push main. Add the release commit to the table below (tags cannot be pushed from Claude's session; create `v<version>` tags from a terminal if wanted).

## Keeping the log consistent when the programme changes
The phone log is `log[date][sessionId][exerciseId] = [{reps, kg, done, t}]`, plus `meta` (name and type snapshot per exercise and session). Rules:
- Exercise ids are permanent. A variation with a different movement gets a new id. Never reuse an id for another movement.
- Rename or merge an exercise: keep the new id and add `oldId:'newId'` to `window.ALIASES` in `data-ex.js`. The log, the video override and the Suivi history are migrated at startup, after a safety copy (`preMigration`).
- Retire an exercise: remove it from the sessions only; keep it in `EX` (or alias it). Its history stays in the Suivi under "Anciens exercices".
- Do not change an exercise `kind` (lift, assist, reps, tick) once released.
- The log format only changes by addition, so an older version of the app can still read it.
`node tools/check_data.js` enforces these rules against `tools/released-ids.json`.
Suivi excludes warm-up stations (items with `warm:true` in the sessions, placed at the start of A, B and C) and every exercise of kind `tick`.

## Rollback
- From the phone: Réglages > Application > "Version x.y" opens the archived copy of that version. The log is shared (same origin), and a banner links back to the latest version.
- Permanent rollback (needs Claude or a terminal): restore the release commit (table below) as a new commit, so Pages redeploys:
  `git checkout f035aa9 -- . && sed -i "s/gym-guide-0.7/gym-guide-0.7-r1/" sw.js && git commit -am "Roll back to 0.7" && git push`
  (a new cache name makes phones refetch; `releases/` and `tools/` are restored too, so re-run `archive.py` afterwards if the listing is wrong).
- Data: Réglages > Sauvegarde > Exporter before any release. The app keeps one automatic safety copy before an import or a clear ("Annuler").

## Releases
| Version | Commit | Archive |
| --- | --- | --- |
| 0.13 | see git log "0.13" | `releases/0.13/` |
| 0.12 | a688b88 | `releases/0.12/` |
| 0.11 | 835b318 | `releases/0.11/` |
| 0.10 | 449dfb4 | `releases/0.10/` |
| 0.9 | 105a9e1 | `releases/0.9/` |
| 0.8 | eddde6c | `releases/0.8/` |
| 0.7 | f035aa9 | `releases/0.7/` |
