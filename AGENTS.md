# AGENTS.md

## Project Direction

This project is currently a GitHub Pages friendly static PWA. The default assumption is: keep it simple, frontend-only, and runnable from static files.

The product direction should remain focused on helping Chinese-native users generate ChatGPT prompts for Japanese workplace communication. Preserve the core structure of audience, channel, purpose, politeness, and length unless the task explicitly asks for a redesign.

## Current Main Files

- `index.html`: Page structure.
- `style.css`: Styling and responsive layout.
- `app.js`: Prompt generation, copy behavior, and history records.
- `manifest.webmanifest`: PWA configuration.
- `sw.js`: Service Worker cache.
- `icon.png`: App icon.

## Development Guidance

- Prefer the current static PWA model when it is enough for the task.
- Codex may refactor code, split files, add new files, and improve UI when it makes the project easier to maintain or use.
- Keep mobile-first behavior and a low-friction user experience.
- Keep code understandable for beginner-to-intermediate maintainers unless the task clearly justifies more structure.
- Do not remove existing features unless the task asks for it or there is a clear replacement.
- Avoid unnecessary complexity, but do not treat the current single-file structure as mandatory.

## Larger Changes

Codex may propose Vite, TypeScript, tests, backend services, API integration, or other tooling when there is a clear reason.

Before making changes that affect dependencies, deployment, privacy, cost, API keys, or security, explain the trade-off first. Include what problem the change solves, what new maintenance burden it adds, and whether it changes GitHub Pages compatibility.

## Testing

- Open `index.html` with VS Code Live Server for the current static version.
- Test prompt generation.
- Test the copy button.
- Test history records.
- Test the layout at phone-width sizes.
- If tooling or tests are added later, document and run the relevant commands.
