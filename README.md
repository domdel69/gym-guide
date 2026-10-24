# Gym Guide

Personal gym programme web app (PWA, French UI). Hosted on GitHub Pages, logs stay on the phone.

- `data-ex.js`, `data-sessions.js`: all content (exercises, sessions, guides). Edit these to change the plan.
- `app.js`, `views.js`, `store.js`, `styles.css`: app code. `sw.js`: offline cache. `version.js` and `VERSION` in `sw.js`: bump both on each release (0.1, 0.2, ...).
- `tools/make_pdfs.py`: regenerates `print/*.pdf` from the data files (needs node, playwright).
