# SLTC LMS

A React and Vite web application project.

## Run locally

```bash
git clone https://github.com/cit-24-01-0476-maker/sltclms.git
cd sltclms
npm ci
npm run dev
```

Open the development URL printed by Vite.

## Available commands

- `npm run dev` — start Vite
- `npm run build` — build the application
- `npm run lint` — run ESLint
- `npm run preview` — preview the build
- `npm run deploy` — build and publish `dist` with gh-pages

## Deployment configuration

The existing `vite.config.js` uses `/` as its base path, suitable for a root-domain deployment. For a GitHub Pages project URL under `/sltclms/`, adjust the base path before building. Publish only after choosing the intended hosting target.

## Contributing

Describe the page affected and the expected behavior. Include a screenshot for UI changes, and run the available build and lint checks.
