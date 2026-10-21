# Portfolio

A personal portfolio with an animated 3D desk scene, readable project stories and
standalone design studies.

Work in progress. The 3D experience is optional; text remains available without
WebGL. JavaScript is required.

## Tech stack and system design

| Layer                 | Tools                                                            |
| --------------------- | ---------------------------------------------------------------- |
| Interface and routing | React, TypeScript, React Router                                  |
| 3D rendering          | Three.js, React Three Fiber, local GLB models and Draco decoding |
| Build                 | Vite, with static output for hosting                             |
| Testing               | Vitest, Testing Library, Playwright                              |

The application runs entirely in the browser, with no application backend or
database. React renders the content and navigation as HTML; the optional 3D
renderer loads separately. Models, artwork and decoders are served locally with
the site. Static alternatives keep the content usable when 3D is disabled,
loading or unavailable.
