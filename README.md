# Portfolio

A personal portfolio presenting projects through a black-and-green, shell-inspired
HTML workspace. A minimal landing page opens About me through an explicit Enter
portfolio action, with no automatic redirect, loading intro or 3D scene.
JavaScript is required.

## Tech stack

| Layer                 | Technology                           |
| --------------------- | ------------------------------------ |
| Interface and routing | React, TypeScript, React Router      |
| Build                 | Vite, with static output for hosting |
| Testing               | Vitest, Testing Library, Playwright  |

## Features

- Enter About me from a minimal landing page, with workflow and direct contact links.
- Browse concise project descriptions and visual previews through native HTML.
- Navigate through a desktop sidebar or a prominent mobile project drawer.
- Open About me at `/about` or individual projects at `/projects/apollo`, `/projects/iris`, `/projects/gateway` and `/projects/dripperz`.
- Disable the bounded decorative glitches through FX or reduced-motion preferences.

## Boundaries and integration

Shared profile styling and reusable UI are documented in the
[portfolio design system](src/design-system/README.md).

The application runs entirely in the browser, with no application backend or
database. React handles content and navigation. No graphics engine, model, decoder
or room poster is downloaded by the website. Earlier scene source and assets remain
on disk for reuse; their tooling dependencies are development-only.

Project displays illustrate the work rather than acting as live integrations
with those products. Current visuals are labelled illustrations, not product screenshots.

See [homepage content](docs/homepage-content.md) for the website's section copy.
The [workspace architecture](docs/scene.md) describes navigation, effects and the retained scene source.
