# Portfolio specification

Status: product direction revised on 2026-10-14 to Vite/React with browser
rendering and ESLint 10. Foundation implementation and its initial publication
are bounded units; later slices, remote configuration and deployment require
separate authorization. Verification evidence belongs in delivery records,
not inferred from these requirements.

## Purpose and outcomes

An English portfolio for job applications and developer-community credibility.
Visitors must be able to understand the author's profile and contact them,
explore a usable 3D engineering universe, evaluate four evidence-backed case
studies, and understand the author's stack and controlled AI-assisted full-stack
engineering workflow. The portfolio itself must demonstrate maintainable,
traceable and recoverable delivery.

## Product contract

- Vite, React and strict TypeScript; client-side React Router and browser-rendered
  content, matching the existing Vite projects' rendering strategy. No runtime
  server rendering or build-time page pre-rendering is planned.
- Independently loaded React Three Fiber/Three.js world. Accessible HTML pages,
  navigation, contact and case studies render in the browser and work without
  WebGL or animation, but require JavaScript. Non-3D/static alternatives mean
  nonanimated browser-rendered content/posters, not pre-rendered route HTML.
- Include a useful static `noscript` notice when JavaScript is disabled; do not
  promise readable case studies or working application navigation without it.
- White/soft-gray surfaces, dark typography, restrained accents, soft shadows
  and minimal futuristic installations. Real UI imagery retains its colors.
- Native scroll drives transitions; no scroll interception, snapping, forced
  animation waits, free flight or autoplay audio.
- Routes: `/`, `/projects`, `/projects/:slug`, `/stack`, `/workflow`, `/about`.
  Normal links, direct anchors, reload, resize and back/forward remain usable
  with JavaScript. Static hosting needs an SPA fallback for direct route requests;
  missing assets must not be rewritten to the HTML shell. Unknown application
  routes show a client-rendered not-found/recovery view; do not assume its HTTP
  status is 404 under an SPA fallback.
- Homepage chapter order: introduction, Iris, 0x, Dripperz, Apollo, AI/FSE,
  contact. A shared chapter configuration connects HTML IDs and world poses.
- Mobile, keyboard, focus/skip navigation, reduced motion, static/loading/error,
  unsupported WebGL and context-loss fallbacks are first-class. Reduced motion
  avoids camera travel. Rendering pauses when appropriate; resources and
  listeners are cleaned up. Per-frame updates do not use React state.
- No CMS, accounts, database, custom API, live telemetry or blog at launch.

## Content and disclosure

Case studies explain problem/users, contribution, demo, architecture, decisions,
tradeoffs, checks, limits and links. Structured metadata includes slug, title,
summary, capability tags, outcomes, delivery state, media alternatives and
provenance, dated evidence and limitations. Schema validation rejects invalid
records; validation is not proof that a claim is true.

- Iris: existing approved discovery/public-wallet/watchlist/resilience and
  accessibility scope; no additional requirements for the Iris project.
- 0x: Shopify cart through native SOL **Devnet** payment, verified settlement
  and exactly one demo order. Never claim mainnet or commercial certification.
- Dripperz: distinguish historical work from the approved faithful local/3D
  showcase rebuild without Web3. Do not expand that project's scope.
- Apollo: private source remains private. Narrative, public-safe diagrams and
  video require disclosure approval; no profitability or live-performance
  claims. Approved video destination, subject to public-content review:
  `https://www.youtube.com/watch?v=7ox8NgQMjfM`. Use click-to-load and a normal
  link fallback, not autoplay.
- Profile, resume, contact destinations, contributions, images, diagrams and
  licenses require approval. No invented personal details or measurements.
- Stack/workflow content maps capabilities to actual project evidence. A
  sanitized approved example traces outcome, specification, plan, implementation,
  checks/review, human acceptance, publication and recovery. Distinguish policy
  from enforcement and demonstrated practice from planned adoption. Preserve
  human responsibility. Never publish raw conversations, private planning
  exports, credentials, central operational memory or private source.
- Development drafts/placeholders cannot appear in public launch builds. Final
  claims depend on dated accepted evidence from the existing projects, but
  those projects' completion does not block this source foundation.

## Delivery slices and acceptance boundaries

1. Source/specification/quality foundation: minimal local shell, metadata
   schema, reproducible toolchain, documentation gates and test harnesses.
2. Delivery/recovery foundation: exact reviewed source selection, isolated
   configuration, fail-closed authorization, target concurrency, version and
   deployment identities, smoke hooks and promotion/rollback runbooks.
3. Accessible HTML shell/design system and real approved navigation/actions.
4. Central hub plus Iris scroll-world prototype; user visual acceptance and
   measured desktop/mobile baselines before agreeing performance budgets.
5. Complete connected world within those approved budgets and asset rights.
6. Four structured readable case studies, independent of the world.
7. Stack/workflow pages and sanitized evidence example; world integration
   depends on the accepted full world.
8. Evidence reconciliation and accepted release candidate: no unresolved
   placeholders, privacy/license audit, metadata/sitemap/robots, accessibility,
   browser/device/fallback/performance checks and user walkthrough.

Search/social acceptance must reflect client rendering: static entry metadata
and client-managed route metadata are distinct. Do not claim route-specific
content or metadata is available to crawlers/link-preview clients that do not
execute JavaScript. Verify actual behavior before making indexing/preview claims;
pre-rendering is not an implied remedy or release requirement.

Governance, provider provisioning and dev/staging/production releases are
separate authorized operations. No competing automatic release paths or ungated
production-on-push. Promote exact reviewed commits, retain prior deployment
identity, and verify recovery without mutating persistent production data.
Actual protections must use functioning CI names and an agreed review/bypass
policy. Missing protection/environment evidence blocks release readiness.

## Foundation implementation contract (0.1.0)

Use npm with an exact lockfile, Node 24.21.0 and npm 11.19.0. Pin compatible
Vite/React/TypeScript, client-side React Router, ESLint 10 and compatible test/lint
dependencies. Replace the prior Next.js packages/configuration, scripts and
generated-output conventions in this local foundation migration.
Initial shell exposes only foundation status and runtime version; it is not the designed product and is
not a public launch. Do not install world dependencies before their slice.

Blocking checks: reproducible `npm ci`, formatting, ESLint including useful
English module/contract/function documentation, TSDoc syntax, strict types,
unit/component tests, documentation-rule regression tests, version alignment,
production build and deterministic local browser smoke tests. Test valid and
invalid metadata, package/runtime/lockfile version drift, missing/malformed
documentation, internal named arrow functions/components/hooks, and generated
artifact exclusions. Trivial anonymous callbacks/declarative tests do not each
need a docblock. Document substantial helpers and edge cases, not just exports;
types stay in TypeScript signatures. Generated/build artifacts are ignored,
not handwritten code. Lint cannot prove documentation usefulness or truth.

The approved lint baseline matches the other Vite foundations: ESLint 10,
TypeScript rules, supported React Hooks rules, and existing documentation gates.
Next-only rules and incompatible legacy React/JSX accessibility plugins are not
retained; no second JSX linter is requested. Do not claim equivalent static JSX
accessibility coverage. Verify keyboard/semantic foundation behavior in browser
tests; future feature slices require appropriate broader accessibility checks.

CI runs checks only; it does not deploy. Dependabot proposes npm and GitHub
Actions updates without auto-merge. README and contribution guidance explain
setup, checks, generated artifacts and approval boundaries. Secrets, caches,
generated builds, test reports and private operational files stay out of Git.

The package, root lockfile entries and runtime version must agree at `0.1.0`.
Future shipped features use deliberate semantic-version increments; `1.0.0`
denotes the accepted initial launch, not completion of planning.

Foundation acceptance after migration: clean install/build and all relevant
checks pass; negative fixtures fail as intended; browser-rendered shell usable
locally; JavaScript-disabled notice verified rather than full no-JavaScript page
content; client routing/direct entry and not-found behavior tested as applicable;
fresh development and production dependency audits reported without assuming
the replacement is clean; read-only code review
after testing; user localhost shell acceptance or explicit skip. Stop before
branch preparation, commit, push or PR creation unless separately authorized.
The agreed bootstrap procedure is to publish the reviewed foundation as the
initial main baseline, after tooling remediation and verification. Publication
is still separately authorized; do not open a PR against a nonexistent base.

## Unresolved later decisions

Visual prototype, numeric asset/loading/render budgets and measurement devices;
final media/licenses/profile/contact/resume and Apollo disclosure; sanitized
workflow example; bootstrap publication authorization and governance review/bypass
policy; Vercel
account capabilities, isolated target identities/access/indexing policy,
release triggers/gates, domains and recovery acceptance. Ask before implementing
these forks. Do not invent priorities, deadlines, numeric guarantees or live
environment readiness.

Source: user-approved Portfolio product direction and delivery acceptance,
2026-10-14, with npm foundation choice and subsequent Vite/ESLint 10 browser-rendering
planning revision approved in this session. The earlier Next.js and proposed
pre-rendered Vite directions are superseded. This document is the public-safe
product contract, not a copy of operational planning exports.
