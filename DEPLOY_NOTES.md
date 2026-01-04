# GitHub Pages Deployment (Project Pages) via GitHub Actions

## Live URL
https://alanharrryy-wq.github.io/hitech-frontend/

## GitHub Settings
Repo → Settings → Pages:
- Source: GitHub Actions

⚠️ Do NOT use “Deploy from a branch” for this repository.
This project deploys exclusively via GitHub Actions.

## Workflow
File: .github/workflows/pages.yml

Build steps:
- Node.js 20
- npm ci
- npm run build

Build environment variables:
- PAGES_BASE=/hitech-frontend/
- PAGES_DEPLOY=true

## Artifact and Deploy
- Upload dist/ using actions/upload-pages-artifact@v3
- Deploy using actions/deploy-pages@v4
- Target environment: github-pages

## Base-path note (important)
This repository uses GitHub Project Pages, which means the site is served under:
/hitech-frontend/

Runtime fetches must be base-path aware.

Recommended patterns:
- `${import.meta.env.BASE_URL}modules.config.json`
- `new URL('modules.config.json', document.baseURI).toString()`

Avoid absolute root paths like:
- `/modules.config.json`

## How to redeploy
- Push to main (automatic)
- Or go to Actions → Deploy GitHub Pages → Run workflow / Re-run jobs
