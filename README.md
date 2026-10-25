# Portfolio

A personal portfolio presenting projects through readable stories and an animated
3D desk scene. The experience is a work in progress; its content remains available
without WebGL. JavaScript is required.

## Tech stack

| Layer                 | Technology                           |
| --------------------- | ------------------------------------ |
| Interface and routing | React, TypeScript, React Router      |
| 3D rendering          | Three.js, React Three Fiber          |
| Models                | Local GLB assets and Draco decoding  |
| Build                 | Vite, with static output for hosting |
| Testing               | Vitest, Testing Library, Playwright  |

## Features

- Explore project stories and profile information through HTML content.
- Navigate an optional 3D workspace with project displays.
- Browse standalone visual and scene studies.
- Read the same core content when 3D is disabled, loading or unavailable.

## Boundaries and integration

Shared profile styling and reusable UI are documented in the
[portfolio design system](src/design-system/README.md).

The application runs entirely in the browser, with no application backend or
database. React handles content and navigation; the optional 3D renderer loads
separately. Models, artwork and decoders are served locally with the site.

Project displays illustrate the work rather than acting as live integrations
with those products. Static alternatives preserve access to content when the
3D experience is unavailable.

See [the product specification](docs/spec/portfolio.md) and
[approved section copy](docs/approved-section-copy.md) for scope and content boundaries.
