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
- Homepage chapter order: introduction, engineering workflow, Apollo, Iris,
  Crypto gateway, contact. The owner explicitly removed the duplicate Apollo entry.
  A shared chapter configuration connects HTML IDs and world poses. Section content
  and composition are proposed in the [storyboard](../docs/section-storyboard.md)
  before choosing 3D objects/animation. This order does not accept the rejected Iris
  object or silently cancel separately specified case studies outside the homepage.
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
- Crypto gateway is the newly requested homepage chapter. Its final story must be
  reconciled with active gateway contracts/evidence; do not transfer legacy 0x
  Shopify, network, settlement/order or readiness claims to the current product.
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

Approved topology (2026-10-14): local → shared dev → manually approved production,
with isolated Vercel dev and production projects. Removing staging and completing
these foundations is the user's main priority, ahead of unrelated feature work.
Governance, provider provisioning and releases are separate authorized operations.
Protected-main merges deploy dev after existing quality checks. Manual dev
redeployment and production workflows run from main with an exact merged source
revision and rerun existing checks against it; never substitute latest main.
Production selects the same source accepted in dev, using native explicit approval,
self-review allowed and administrator bypass disabled. Keep production disabled if
enforcement is unavailable pending an explicitly approved alternative. Disable
competing Vercel Git auto-deployment; serialize each target without cancelling an
active mutation and reject superseded automatic dev runs before mutation.

Record dev candidate source/version/provider identity and relevant configuration;
recheck them after acceptance and before promotion. If a deployment or configuration
change interrupts validation, repeat affected acceptance on the selected candidate.
Evidence is reviewed manually; a source input alone does not prove dev acceptance.
Move candidate walkthrough and applicable application rollback rehearsal to dev;
retain prior deployment identity and verify recovery without mutating persistent
production data. Restore and revalidate the selected dev candidate after rehearsal.
Production smoke checks remain read-only. Operational hosting of the foundation
shell is not acceptance of the completed portfolio or permission for public launch.

Remove staging from active delivery targets and instructions. Inventory any existing
resource/credential consumers, triggers and recovery evidence before separately
authorized retirement. Preserve historical evidence; do not automatically delete
resources or revoke shared credentials.
Actual protections must use functioning CI names and an agreed review/bypass
policy. Missing protection/environment evidence blocks release readiness.

Approved Iris-style GitHub authentication adjustment: use the built-in read-only
`GITHUB_TOKEN` for workflow source ancestry/freshness checks, with no additional
GitHub personal access token and no copying of the owner's CLI credential into
Actions. The operator reads back actual main/environment policies through the local
authenticated CLI/API during setup/readiness, before authorizing enablement or
promotion and after policy/access changes. Native production approval remains
mandatory; the controller does not query policy/review-history APIs or detect later
policy drift. Missing/uncertain operator evidence blocks authorization, not an
automated runtime policy check. Preserve production's new-dispatch/no-rerun rule
and manual verification of the exact accepted dev candidate. Production uses only
its own environment-scoped deployment credential; no dev-verification token or
custom promotion manifest is required. The owner, not an automated cross-project
controller, checks dev source/version/provider/configuration and recovery evidence
after acceptance and immediately before native approval. Drift invalidates affected
acceptance; a selected SHA or green CI is not acceptance evidence.

### Delivery-foundation acceptance

Before implementing remote delivery, confirm provider/account support for the
required approval and isolation controls, target identities, dev access/indexing
policy, production domain/access policy and the main review/bypass policy. Missing
decisions block the affected operation, not local requirements work. Do not record
credentials in source or treat requirements approval as provisioning permission.

The delivery implementation must provide testable evidence that:

- Automatic dev delivery follows successful existing checks for the exact merged
  source. Manual source inputs reject revisions not reachable from main; checks
  run against the selected source, not merely the workflow revision.
- Missing target configuration, missing approval or mismatched candidate evidence
  prevents the affected deployment. Concurrent target mutations are serialized;
  superseded automatic dev candidates cannot overwrite a newer candidate.
- Each target reports source revision and application version, and records its
  provider deployment identity and relevant configuration identity. Production
  approval refers to the exact candidate accepted in dev; target-specific builds
  do not imply identical artifacts or configuration.
- Hosted direct routes, unknown-route recovery and missing-asset behavior satisfy
  the SPA contract. Dev walkthrough and applicable read-only smoke checks verify
  the selected deployment rather than only a local preview.
- Recovery instructions identify the previous deployment and candidate, describe
  application rollback and revalidation, and explicitly handle first deployment
  when no previous deployment exists. Never invent recovery evidence or claim a
  rollback rehearsal passed without an eligible previous deployment.

First-production recovery policy approved 2026-10-16: complete dev acceptance and
a real dev application rollback rehearsal, then restore and revalidate the selected
candidate before first production. The owner accepts that no prior production
deployment exists to restore. On failure, stop and inspect actual provider state;
recovery requires separate authorization, a new production dispatch selecting an
exact dev-accepted revision, and fresh native approval. No blind retries, approval
bypasses or production-data changes are allowed. Retain the first accepted
production deployment as a rollback candidate for later releases, subject to the
same eligibility/configuration checks. Policy acceptance alone does not authorize
publication, enablement or deployment.

Local implementation/checks and read-only review precede separately authorized
remote configuration and deployment. Operational acceptance requires actual dev
and production evidence; local tests alone cannot complete it. Stop this
requirements slice after consistency checks and read-only review, before delivery
implementation, publication, provisioning or deployment.

The subsequent local delivery-implementation slice is authorized separately. It
adds disabled-by-default workflows, exact-source/configuration guards, static
hosting output, read-only smoke hooks, negative regression tests and delivery/
recovery instructions. Its checkpoint is local checks and read-only review, not
remote enablement or operational acceptance. See [delivery runbook](../docs/delivery.md).

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

The current source foundation's CI runs checks only; delivery workflows belong to
the separately authorized delivery implementation above. Dependabot proposes npm and GitHub
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

## Accessible profile shell (0.2.0 local slice)

The next authorized local slice adds a responsive, motion-free HTML profile shell
and reusable visual tokens: white/soft-gray surfaces, dark text, restrained accents,
native section links, a keyboard skip link, visible focus and real email contact.
The owner supplied their CV for profile information: Guillaume Ammouche,
Full-Stack Developer, React/TypeScript and Python/FastAPI, and the email destination
used in the shell. Profile/skills copy is bounded to that supplied material. Do not
publish the PDF, invent project outcomes or treat this as Apollo disclosure approval.
The homepage exposes introduction, about, expertise and contact only; the complete
chapter sequence, dedicated routes, case studies and world remain later work.
No dead navigation or fake resume download is needed to represent those future slices.

This feature candidate deliberately aligns package, lockfile and runtime at 0.2.0;
the 0.1.0 foundation contract above describes the preceding foundation, not this
candidate. Preserve noindex and the JavaScript-disabled notice. Check native anchor
entry/reload/history, keyboard/focus, narrow layouts and reduced motion. Stop after
local checks, read-only review and owner visual acceptance; no publication or
deployment is authorized by this slice.

## Local visual-direction checkpoint

The local `/design` route presents the proposed hub/Iris architectural gallery as
original static vector artwork, not live 3D. It is a review-only addition to the
0.2.0 local candidate, not a launch route or another shipped version. See
[art direction](../docs/design-direction.md). Stop for owner visual feedback before
installing world dependencies or treating this proposal as the accepted prototype.
Actual WebGL fallback/lifecycle behavior and measured performance remain unverified.

## Hub + Iris local prototype (0.3.0)

Owner visual direction acceptance permits the bounded real-3D hub/Iris prototype,
not expansion to the completed world. The local `/world` route pairs native HTML
chapter anchors with shared camera poses. Independently loaded React Three Fiber
and Three.js render original procedural geometry, without external assets or data.
Reduced-motion and narrow-viewport users receive the static illustrated alternative,
without automatically loading the engine. An explicit stationary-3D option explains
the fallback and permits real 3D without camera travel under those policies.
Module/render failures and context loss preserve HTML
and a still view; rendering is demand-driven and pauses offscreen/while hidden.

The new optional-world feature deliberately aligns package/lock/runtime at 0.3.0.
Renderer settings are provisional implementation choices, not accepted performance
budgets. Collect preliminary local browser evidence and report its limitations;
physical devices, budgets and full-world expansion remain future decisions.
See [prototype checkpoint](../docs/world-prototype.md). Stop after local checks,
read-only review and owner walkthrough; no publication or deployment is included.

## Integrated page-composition revision

Owner clarification supersedes the boxed viewport/split-column presentation:
3D must be part of the page composition, not a window embedded beside content.
Rebuild the local homepage as one viewport-sized world beneath native HTML sections,
with reserved readable space and the same composition for static/error/mobile modes.
Keep `/world` as a preview alias and the retained profile at `/about`. This remains
the ongoing 0.3.0 prototype, not a new shipped release. The current Iris object was
rejected; retaining it temporarily is for composition assessment only, not art acceptance.
The complete world, final project art and measured budgets remain later checkpoints.
Stop after local checks/review and owner visual feedback; no publication/deployment.

## Approved introduction integration checkpoint

The owner accepted Blender `review-06` as the introduction's visual baseline:
rear three-quarter desk scene, black hoodie/joggers, black ergonomic chair,
plant, green flask and both parallettes on the desk. The next authorized local
slice derives a static web model and transparent poster, integrates them behind
the introduction HTML with responsive framing, and verifies loading, model/engine
failure, reduced-motion/mobile and context-loss fallbacks. No character animation,
new scene art, final section-copy rollout, publication or deployment is included.

Keep the old hub/Iris installation clearly provisional and separate from the
introduction; the approved scene must not acquire its display platform. Preserve
the existing native-scroll policy and stationary-3D opt-in, with no idle animation.
The Blender procedural materials require a browser visual checkpoint rather than
a claim of pixel-identical export. Remain within the ongoing 0.3.0 local prototype.

## Unresolved later decisions

### Approved text-first section rollout

The owner authorized adding the approved text sections ahead of their 3D scenes.
Use `docs/approved-section-copy.md` without narrative rewrites: Introduction,
Engineering workflow, Apollo, Iris, Crypto gateway and Dripperz. Place Dripperz
after the gateway provisionally; Contact retains the earlier unfinalized copy.
Add native section links and readable responsive HTML, without introducing media,
live demos, wallet connections, extra disclosures or new scene art/animation.

Visual prototype, numeric asset/loading/render budgets and measurement devices;
final media/licenses/profile/contact/resume and Apollo disclosure; sanitized
workflow example; governance review/bypass policy; Vercel
account capabilities, isolated target identities/access/indexing policy,
domains and recovery acceptance. The dev/production triggers and gates above are
approved requirements, not evidence of enforcement. Ask before implementing
these forks. Do not invent priorities, deadlines, numeric guarantees or live
environment readiness.

Source: user-approved Portfolio product direction and delivery acceptance,
2026-10-14, with npm foundation choice and subsequent Vite/ESLint 10 browser-rendering
planning revision approved in this session. The earlier Next.js and proposed
pre-rendered Vite directions are superseded. This document is the public-safe
product contract, not a copy of operational planning exports.
