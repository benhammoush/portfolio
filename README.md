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

- See a dotted travel globe, name and typed personal details on the landing page, with one Enter portfolio action.
- Find workflow steps and direct GitHub, résumé and email links on About me.
- Browse concise project descriptions and visual previews through native HTML.
- View each project's frontend and backend on GitHub; Dripperz is frontend-only.
- Navigate through a desktop sidebar or a prominent mobile project drawer.
- Open About me at `/about` or individual projects at `/projects/apollo`, `/projects/iris`, `/projects/gateway` and `/projects/dripperz`.
- Respect reduced-motion preferences for decorative glitches and animation.

## Boundaries and integration

Shared terminal tokens, base styles and controls are owned by the
[portfolio design system](src/design-system/README.md).

The application runs entirely in the browser, with no application backend or
database. React handles content and navigation. No graphics engine, model, decoder
or room poster is downloaded by the website. The globe uses local Canvas 2D artwork,
not a 3D engine.

Project displays illustrate the work rather than acting as live integrations
with those products. Apollo, Solana Payments and Dripperz use product screenshots;
Apollo shows example data and Solana Payments shows Devnet. Iris remains labelled
as an illustration, not a product screenshot.

Website copy lives beside its reader in `src/world/homepage-content.md`.
The downloadable résumé is `public/resume/Guillaume_Ammouche_CV_ATS.pdf`.
