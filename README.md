# CoWork

Personal design OS — four apps, one dark theme, shared localStorage.

## Apps

| File | What |
|------|------|
| `index.html` | Hub — live stats from all three apps |
| `capture.html` | Capture ideas, questions, and links on the go |
| `dashboard.html` | Tasks board + context (reads/writes `TASKS.md` via File System Access API) |
| `linkedin.html` | LinkedIn content studio and post backlog |

## Deploy to GitHub Pages

1. Create a new public repo (e.g. `cowork-web`)
2. Push these files to `main`
3. Go to **Settings → Pages → Source: Deploy from branch → main / root**
4. Your hub will be at `https://<username>.github.io/cowork-web/`

## iPhone home screen

Once live, open each URL in Safari → Share → **Add to Home Screen**:

- `…/index.html` → CoWork hub
- `…/capture.html` → Capture (main daily driver)
- `…/dashboard.html` → Dashboard
- `…/linkedin.html` → LinkedIn

All apps share localStorage on the same origin, so the hub shows live counts from all of them.

## TASKS.md

`dashboard.html` uses the browser's File System Access API to read and write your `TASKS.md` directly. On first open, click **Open Folder** and point it at the folder containing `TASKS.md`. It will remember the file handle for that session.
