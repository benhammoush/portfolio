# Portfolio

First 3D model milestone, version **0.3.0**. This is not the finished portfolio or
a public launch. Final project scenes, character animation and the completed
connected world are future work. Product requirements: [spec/portfolio.md](spec/portfolio.md).
The homepage now composes readable HTML through one full-viewport world, rather
than placing a bordered canvas beside text. `/world` is an alias of this composition;
`/about` retains the approved CV-based profile. No CV PDF or private project material
is published. The original desk/character scene is the accepted introduction
baseline; the older Iris object remains provisional and was not accepted.
The [approved text](docs/approved-section-copy.md) is implemented in this order:
Introduction → Engineering workflow → Apollo → Iris → Crypto gateway → Dripperz,
followed by the still-provisional Contact section. Dripperz placement is provisional.
See [model source, export and review boundaries](docs/intro-scene.md).
The [evidence/frame plan](docs/section-frames.md) and [layout contact sheet](docs/section-frames.svg)
select source-grounded content anchors before new objects or animation are chosen.
Local visual direction is available at `/design`: an original static hub/Iris
composition study, not live 3D or a finished case study. See
[art direction and its visual checkpoint](docs/design-direction.md).
Optional WebGL is independently loaded; static, loading and failure views share
the same page composition. See [prototype behavior and measurement limits](docs/world-prototype.md).
The foundation now uses **Vite + React + client-side React Router + ESLint 10**.
Content is rendered in the browser; no SSR or build-time page pre-rendering.

## Local setup

Use **Node 24.21.0** and **npm 11.19.0** (`.nvmrc`, `.npmrc`, package engines).
From this repository:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open <http://127.0.0.1:5173>. The shell shows the profile and runtime version;
there are no credentials, environment variables, remote data or external world assets.
On Linux, browser setup may need `npx playwright install --with-deps chromium`.
Install commands download dependencies/browser binaries; they do not deploy.

## Verification

```sh
npm run check
```

Runs format, code/documentation lint and strict TypeScript,
version alignment, unit/component/rule regression tests, production build, then
Chromium smoke tests. Browser tests launch a local preview of built static files on
`127.0.0.1:3100`; keep that port free. They never reuse an unrelated local server.
`npm run build` precedes standalone `npm run test:e2e`.

Individual commands are in `package.json`; `npm run format` rewrites formatting.
`npm run preview` inspects a previously built static bundle at
<http://127.0.0.1:4173>; Vite preview is not a production server. Automated
tests do not replace the author's manual localhost acceptance.

## Layout and version contract

- `index.html`: English document, static entry metadata, no-index policy and a
  helpful noscript notice. The initial app container is empty.
- `src/main.tsx`, `src/App.tsx`: browser rendering and client routing. `/` and
  `/world` use the integrated composition, `/about` the retained profile, `/design`
  the earlier static study. Unknown routes recover; case-study routes are future work.
- `src/HomePage.tsx`, `src/NotFoundPage.tsx`: accessible profile and a
  keyboard-usable home link from unknown routes.
- `src/content/project-schema.ts`: strict future metadata schema; no real records.
  Schema validity does not prove disclosure approval, asset rights or claim truth.
- `src/appVersion.ts`: runtime version; `scripts/check-version.mjs` checks it against
  `package.json` and both root `package-lock.json` entries. Update all deliberately.
- `tests`: isolated unit/component/documentation/version and production-browser
  checks. Synthetic fixtures are not public project claims.
- `.github`: foundation quality CI, dependency-update proposals and
  dev/production delivery workflows.
- `scripts/delivery*.mjs`, `docs/delivery.md`: fail-closed delivery guards, hosting
  output, HTTP smoke hooks and configuration/promotion/recovery instructions.

Generated `dist`, type caches, browser reports and dependencies are ignored.
Legacy ignored `.next`/`next-env.d.ts` output may remain locally after migration;
it is not loaded, linted, typechecked or part of the Vite artifact. Do not discard
unrelated local files during migration. No remote fonts/images are needed.

## Rendering and static hosting

The application requires JavaScript. With it disabled, only the static notice and
entry metadata remain; full case studies/navigation are not promised. Non-WebGL
and reduced-motion alternatives in the prototype are still browser-rendered.

Local preview demonstrates direct SPA entry and a client not-found view. Its
fallback can return HTTP 200 for an unknown app route; that is separate from the
not-found UI. A local-preview hook rejects missing `/assets/` and file-like URL
requests instead of returning the HTML shell. The delivery implementation generates
filesystem-first Vercel hosting output with asset errors and SPA fallback; actual
hosted behavior still needs deployed verification. Client-managed route metadata is not guaranteed
for crawlers/link-preview clients that do not run JavaScript.

## Compatibility and boundaries

Dependencies are exact and locked. Vite 8.3.4 and its React plugin 6.1.2 match;
TypeScript 5.9.3 stays within the selected TypeScript-ESLint/TSDoc dependency ranges.
ESLint 10.12.0, TypeScript rules, React Hooks 7.1.1 and the existing documentation
presence/structure plus TSDoc syntax gates form the supported baseline. The lockfile is authoritative
for transitive packages; do not upgrade one tool in isolation without rerunning gates.

The author chose the other Vite foundations' lint strategy, not a second JSX linter.
Next.js/its lint bundle and the incompatible legacy React/JSX accessibility plugins
are removed. Do not claim that generic TypeScript/Hooks lint preserves all their
static checks. Existing documentation gates remain enforced; keyboard/semantic
browser smoke is not full accessibility certification for future features.

Run `npm run audit:dependencies` for fresh full and production dependency-graph
audits; CI runs it as a separate blocking check. Removing a vulnerable chain does
not prove the replacement has no vulnerabilities. Never use forced downgrades or
unreviewed overrides to turn the audit green. Audit is dated graph evidence, not
proof of exploitability or all bundled code.

CI's check is **Foundation quality**. Source configuration does not prove that
this check has run remotely or that main protection is enforced. The bootstrap
procedure establishes the reviewed foundation as initial main after remediation
and verification; later publication and governance review/bypass policy require
their applicable authorization. No dev/production target is provisioned or certified by
these files. Local delivery tooling owns isolated exact-revision release and recovery
contracts, not evidence that remote controls work.

The approved delivery topology is local → shared dev → manually approved production,
using isolated Vercel projects and no active staging target. This is a requirement,
not a claim that hosting or approval controls exist. See the
[delivery requirements and acceptance checkpoint](spec/portfolio.md#delivery-foundation-acceptance)
and the [delivery runbook](docs/delivery.md). `DELIVERY_ENABLED` must remain unset
until separately authorized remote setup and readiness review; no workflow was
enabled or deployment performed by adding these files.

Local implementation does not authorize Git publication, remote settings, provider
provisioning, deployment or production-data mutation. No merge or auto-merge is
configured; the added delivery path is disabled by default. Never commit secrets, private source, raw conversations,
private planning exports or central operational memory. See [CONTRIBUTING.md](CONTRIBUTING.md).
