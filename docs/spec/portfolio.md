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
- Native section snapping drives transitions, with anchors at the top, profile,
  workflow, each project and contact. Vertical wheel gestures select adjacent anchors
  rather than skipping sections; touch and keyboard scrolling remain browser-owned.
  No forced animation waits, free flight or autoplay audio. Oversized sections and
  expanded details remain natively scrollable; reduced motion removes smooth scrolling.
- Routes: `/`, `/projects`, `/projects/:slug`, `/stack`, `/workflow`, `/about`.
  Normal links, direct anchors, reload, resize and back/forward remain usable
  with JavaScript. Static hosting needs an SPA fallback for direct route requests;
  missing assets must not be rewritten to the HTML shell. Unknown application
  routes show a client-rendered not-found/recovery view; do not assume its HTTP
  status is 404 under an SPA fallback.
- Homepage chapter order: introduction, engineering workflow, Apollo, Iris,
  Crypto gateway, contact. The owner explicitly removed the duplicate Apollo entry.
  A shared chapter configuration connects HTML IDs and world poses. Section content
  and composition are proposed in the [storyboard](../section-storyboard.md)
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
remote enablement or operational acceptance. See [delivery runbook](../delivery.md).

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
Actions updates without auto-merge. Package scripts define automated checks;
the delivery runbook documents release procedures and approval boundaries. Secrets, caches,
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
0.2.0 local candidate, not a launch route or another shipped version. Its retained
[static study](../../src/design/DesignPage.tsx) is not the current desk-scene direction.
Stop for owner visual feedback before
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
See [prototype checkpoint](../world-prototype.md). Stop after local checks,
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

## Local hero-direction comparison

The owner authorized two static hero mockups before choosing a replacement
composition: typography-led editorial at `/hero-study` and a closer workspace
crop at `/hero-study/immersive`. Use the existing transparent poster and approved
introduction wording, with the professional role as the dominant statement.
Clearly label the comparison as local static artwork, not live 3D. Keep the
homepage, scene assets, camera and animation unchanged. Stop for owner visual
selection after affected checks and read-only review; no publication/deployment.

The owner preferred the immersive direction, with centered copy/actions above
the large workspace crop and readable text separate from the artwork. Its single
headline is “Hi, I’m Guillaume, a full-stack developer”, replacing the separate
greeting and role in this mockup only. Homepage integration remains a subsequent
checkpoint. The owner subsequently accepted this composition and authorized local
homepage integration: use the same single heading in the approved section copy,
center the introduction, and align live rendering to its inline poster rectangle.
Preserve model appearance, animation controls, stationary/reduced-motion policies,
native scrolling and failure alternatives. Stop after affected checks, read-only
review and owner visual feedback, without publication or deployment.

## Subsequent section visual hierarchy

Content is primary; 3D is supporting visual context, not the main attraction.
Reuse the accepted coding-at-the-desk scene across subsequent sections instead
of designing a separate installation for each. Preserve its simplicity with
small, selective chapter cues; do not accumulate decorations or introduce large
transformations, floating interfaces, particle effects or dramatic camera moves.
Monitor changes and occasional small desk details are proposals for visual review,
not approved new assets or simulated live product activity. Keep HTML copy/actions
dominant and independently usable, including mobile/static alternatives. Avoid
unnecessary asset weight, dependencies and rendering work; no numeric performance
budget is implied. This revises the separate-scene art direction, not the approved
section content or the requirement to review visuals before implementation.

The authorized next checkpoint is a local static cue study at `/scene-study`,
`/scene-study/workflow` and `/scene-study/iris`: reuse the existing poster with
small schematic screen changes only, with no additional desk objects, alongside approved HTML
copy. Label the cues as concepts, not actual product UI or live activity. Keep
the accepted homepage, model, animation and dependencies unchanged. Stop after
affected checks and visual review before implementing any new 3D details.

Screen concepts use a compact engineering-stage workspace for Workflow and an
illustrative markets/wallets/watchlist workspace for Iris, not identical generic
lists. A collapsed, keyboard-operable close-up may expose the same artwork for
review without enlarging the scene; it is not a product control or new 3D asset.

The subsequent Workflow screen concept at `/screen-study/workflow` is designed
for a proposed monitor close-up, not wide-view legibility. Use colorful Interface,
Services and Data shapes, simple workflow steps and quality concepts. Do not use
code or code-like lines, feature briefs, endpoints, schema details or project-specific
stack explanations. The visual is supporting artwork, not a technical case study,
execution evidence, measured quality result or certification.
Keep it separate from the current screen placeholder until visually accepted;
no camera integration, homepage change, new dependencies or 3D assets in this pass.
The owner additionally authorized subtle decorative animation of this screen
concept, subsequently requesting more visible motion: flowing connectors,
animated interface/service/data graphics and sequential workflow highlights.
Provide pause/resume, honor reduced motion, pause while hidden/offscreen and clean
up visibility listeners/observers. Do not imply actual execution or completed checks.

The owner accepted the more visible concept animation and authorized the local
Workflow monitor integration, trying a native-scroll over-right-shoulder approach
to avoid the character blocking the display. Preserve the accepted hero and HTML
copy. Only Workflow gains a new close-up/screen state; later sections retain the
base desk, not the superseded separate Iris installation. Use an unlit local
surface with owned/disposed texture resources, bounded visible playback, shared
pause controls and no travel/animation in stationary policies. Export the static
SVG from the review component (`npm run generate:workflow-art`); use it as the
independent HTML alternative and check its provenance. This is local visual
acceptance work, not device-budget acceptance, publication or deployment.

## Apollo screen concept checkpoint

The owner authorized a local static monitor concept at `/screen-study/apollo`
before integration. Use original, colorful market-context, strategy, engine and
monitoring shapes based only on the approved section narrative. No private source,
actual UI screenshots, real market data, signals, returns or live-performance
claims. Label both the review page and artwork as illustrative, not live or actual
architecture documentation. Preserve the homepage, camera, models and dependencies;
stop after affected checks and owner visual feedback before integration/animation.
This is not public disclosure or publication approval.

The owner accepted this Apollo concept and authorized continuing into decorative
animation and local monitor integration. Use the same camera approach, one shared
surface/texture and upload cap as Workflow, switching artwork as Apollo enters.
Only the fixed illustrative shapes move; no live data, trading simulation or
performance claims. Preserve the hero, later section art, shared pause controls,
static/reduced-motion alternatives and failure handling. Review locally after
affected checks before any publication or deployment.

## Unresolved later decisions

### Approved content-first visual revision

The owner rejected the automatic close-up presentation and authorized all eight
listed improvements. This supersedes the automatic Workflow/Apollo camera trial:
HTML controls layout, section rhythm and contrast; the existing desk is peripheral
support. Preserve approved narrative and the centered hero. Use one fixed lens
per responsive layout, a single departure into a stable reading composition and
an optional monitor inspection, not repeated chapter zooms. Frame geometry away
from copy without foreground washes. Replace the full-width viewer caption with
compact accessible controls that never fade the text.

Recompose existing original artwork to the physical display ratio, without
stretching it or adding scene assets/dependencies. A persistent illustrative
workspace uses deliberate, brief tab/pointer actions coordinated with the existing
authored mouse gesture. Heading reading position selects views with reverse-scroll
hysteresis; interrupted transitions follow the latest request, never block scroll.
Only view content changes, not the whole monitor. Entry emphasis settles during
reading. Pause/static/reduced-motion changes are immediate and unanimated; retain
independent small screen alternatives and failure/resource/upload policies.
No private source, real market data or claims are added. Stop at local affected
checks, read-only coupled review and a visual walkthrough; no publication/deployment.

Following owner feedback, replace the abrupt hero-screen replacement with a
deliberate application launch at Workflow's heading reading line. Keep the actual
original model screen underneath a transparent shared overlay; a cursor selects
the workspace launcher and the application window opens above it. Do not change
the hero pose, text hierarchy, camera, assets or later tab transition. Reverse
scroll closes the window coherently; direct anchors and paused/static policies
resolve immediately without forcing visitors to watch the launch.

The owner further requested that the default monitor itself resemble an OS window.
Use an original, quiet desktop with an open portfolio window and a persistent
Workspace launcher, so the cursor selects an existing control. Keep the same shared
canvas/texture, launch action, camera and text composition; no operating-system
branding, new scene/model assets or runtime dependencies. Match the static/loading
hero alternative to the desktop. The model's original screen remains untouched
under the owned canvas surface; stationary opt-ins show the same still desktop.

The owner subsequently approved replacing the post-hero two-column reading layout
with a centered editorial column and a much smaller, low-contrast continuous desk
backdrop. Preserve the hero and approved wording. Project labels anchor the text;
independent static artwork stays small and secondary. Only an explicit monitor
inspection restores the split reading/screen study; returning restores the centered
article. This is a local visual checkpoint, not publication or performance acceptance.

The owner then requested a centered background scene like the hero rather than a
peripheral desk. Keep the editorial article centered; use a rear-facing centered
desk at low contrast behind it. Only explicit inspection restores the right-side
screen framing. The hero itself, copy, motion policies and resource limits remain.

The owner further requested keeping the camera close to the monitor instead of
pulling back during reading. Reuse the monitor close-up pose for the centered,
low-contrast background. Explicit inspection changes projection/presentation, not
distance; preserve the opening hero and the centered HTML reading layout.

The owner then requested stronger overall readability and text inside boxes rather
than floating. Use solid light reading cards with subtle borders, comfortable inner
padding, stronger body contrast and tighter section/paragraph spacing. Keep the
close-up background visible around, not through, those cards. Preserve approved
wording, native navigation, the hero and optional inspection/motion alternatives.

The owner next authorized trying a desktop split composition instead of a background:
clear 3D in its own column opposite the reading card, alternating sides by section.
Workflow starts with text left/scene right; Apollo reverses, and following sections
alternate. Keep one shared scene, existing monitor artwork, approved copy and hero.
Narrower layouts stay stacked with independent still artwork; no scene behind text.

The owner also requested removing the bottom controls ribbon. Keep motion/still
controls accessible in the header area instead, with no fixed bottom strip.

The owner next requested less upfront text and smooth movement between scene
columns. Keep the first two approved paragraphs visible, with remaining approved
wording in native keyboard-usable Read more disclosures (also for the longer
profile). Do not silently delete or rewrite claims. Damped projection movement and
its clipping aperture follow the latest requested side; reverse scrolling interrupts
smoothly. Paused/static/reduced-motion changes remain immediate, with no scroll waits.

The next local revision replaces free resting scroll positions with section anchors
(hero/top, profile, workflow, each project and contact). Vertical wheel gestures
advance one adjacent stop, including momentum handling and interruptible reverse
intent; browser zoom, horizontal gestures, touch and keyboard remain available.
Oversized/expanded content must remain readable before moving to another section.
Remove the canvas clipping aperture, not the opaque reading-card backgrounds: the
shared scene may extend behind the layout without a hard vertical cutoff. Keep
the existing alternating projection and allow the shared flag/character clip to
continue beyond the hero while visibly rendered. Retain pause, reduced-motion,
stationary, hidden-tab and offscreen safeguards; bound working-loop and rendering
resolution costs. Verify locally and obtain owner visual acceptance before designing
Iris, Crypto gateway or Dripperz monitor artwork. No publication or deployment is
included; hosting foundation acceptance remains separate from design/public launch.

The subsequent composition revision prioritizes Portfolio's readable content over
the decorative 3D background. Preserve the hero, approved copy, existing monitor
artwork/desktop/tab behavior, anchor navigation and motion/static alternatives.
Post-hero sections share one stable reading column rather than alternating sides;
use a dominant heading, quieter chapter labels, bounded paragraph line lengths and
an opaque reading surface. Keep the desk smaller and peripheral, with an independent
size cap so large screens do not turn it into the main element. Explicit inspection
may enlarge the scene without moving or narrowing the reading surface. No monitor
artwork redesign, other-product changes, publication or deployment is included.

The owner selected the project-led text presentation: use the project name as the
section heading, retain the approved story sentence as a lead, and group the first
two unchanged paragraphs under context-appropriate labels (for example Starting
point / My contribution for Apollo, Approach / Delivery for Workflow). Use a light
accented contribution block rather than one enclosing card around the whole story.
Subordinate headings remain below each project heading in the semantic hierarchy.
Preserve Read more, stable fragment/monitor identities, the hero, all approved copy
and every monitor artwork. This remains a local composition/visual checkpoint.

The owner subsequently selected reading-first direction D and authorized local
implementation together with subtle section camera poses. Use a calm, bounded,
unboxed reading column, quiet project identity and an expressive system-serif
story lead. Preserve approved paragraphs verbatim; draft shortened summaries from
the design study are not implicitly approved. Do not change monitor artwork.

Keep the hero's accepted rear framing. About docks into the small lower-right base
pose; Workflow turns slightly toward the monitor; Apollo is marginally closer;
Iris is wider with a reversed small turn; Crypto gateway is neutral; Dripperz has
a distinct opposite turn; Contact returns to the base. The owner found the initial
three-degree/five-percent variations too similar and requested a clearer moving
effect. Use distinct adjacent orbit targets (up to sixteen degrees either side of
base), scale between 0.92 and 1.12 and vertical shifts up to seven percent of the
viewport, while keeping the text stationary and the desk peripheral. Camera position/target,
scale and small vertical shifts blend from native section-anchor scroll progress,
with eased endpoints, immediate reverse intent and no queued travel or forced waits.
Idle camera framing settles; existing character/flag motion remains independent.
Pause selects the reached pose immediately without interpolated travel. Reduced
motion and narrow stationary opt-ins keep stationary framing. Re-measure anchors
after resize or expanded-copy changes. Obtain local checks, browser verification,
read-only review and owner visual acceptance; no publication/deployment is included.

The owner then rejected the repetitive alternating movement and authorized a
complete physical-landmark camera route, superseding the orbit/scale/lift targets
above: accepted wide rear hero → About over the character's left shoulder toward
the monitor → Workflow monitor top-right → Apollo outer right monitor edge → Iris
green flask → Crypto gateway mouse on the mat → Dripperz keyboard/typing hands →
Contact wider rear-three-quarter conclusion, not a reset to the opening pose.
Use world-space camera eyes and focal points, gliding between section waypoints;
backward scroll retraces the route. The owner selected a contained right-side
scene area for close-ups, preserving the full-width hero and unboxed reading text.
The subsequent visual revision removes the hard vertical division: blend the scene
edge into the shared background instead of adding an opaque reading surface; keep
the text crisp and the same physical camera waypoints.
The owner subsequently selected full-screen scenery behind a frosted reading
surface, superseding the side rail and feather. Keep the hero and physical camera
route; remove reading-mode masks and rail framing. Keep focal details visible
beside the text through off-axis composition, not a clipped scene area. Apply backdrop
blur only behind post-hero text, with a translucent tint strong enough to preserve
at least WCAG AA text contrast against the darkest scene geometry. Keep lettering
fully opaque and unblurred, and use a more opaque fallback when blur is unsupported.
The owner then selected one full-height frosted-white left half (50% of the desktop
viewport) instead of individual rounded panels. Keep all desktop reading content
within that half and remove its card borders/corners. Hide the sheet in the hero;
its visibility must not depend on the 3D engine. Narrower layouts retain a readable
full-width text surface, not a cramped half-screen column.
The owner then replaced the individual project waypoints with one fixed monitor
top-right camera from Workflow through Dripperz: share Workflow's eye, focal point
and framing span across all five sections, so forward/reverse project scrolling
and expanded-copy reading do not move the camera. Keep Hero, About and Contact
views, the full-screen scene, left-half frosted reading surface and explicit screen
inspection behavior unchanged.

The owner later changed this camera direction: keep the About view through Workflow
and every project section instead of switching to the monitor's top-right view.
The monitor artwork remains in the scene but is not the camera focal point. Keep
the separate Contact conclusion, Hero, reading surface and explicit screen
inspection behavior unchanged.

The owner subsequently authorized the missing Iris, Crypto gateway and Dripperz
monitor designs and their section integration. Create original public-safe vector
concepts from the approved narratives: public-chain analytics, portable checkout
with explicit trust boundaries, and a cyberpunk mint workspace. Mark sample values
and activity as illustrative; no real addresses, credentials, payments, minting,
collection assets or private product source. Add the three views to the same
heading-led workspace and preserve direct entry, reverse intent, pause, reduced
motion, independent artwork failures, HTML alternatives and bounded texture uploads.
Do not change the existing Workflow/Apollo artwork or approved copy. Preserve the
About camera view, left-half reading surface and explicit screen inspection.
Local verification and owner design review only; no
publication/deployment is authorized.
Do not alter model or artwork. Preserve the pause, stationary, reduced-motion,
keyboard, fallback and expanded-copy policies and the local-only endpoint above.

### Approved personal-details-01 integration

The owner accepted the refined introduction and authorized local web integration:
desk-level rear perspective, black crewneck without a hood, simple black office
chair, correctly connected desk, branching plant, small Vietnam flag and green
flask. Remove parallettes. Use transparent live/poster assets without a floor or
cast ground shadows, while retaining gentle material shading, readable HTML,
responsive/static alternatives and graphics failure handling. No character
animation, PR update, merge or deployment is included in this checkpoint.

### Approved local loading optimization

The owner authorized a lighter model/loading pass while preserving the accepted
personal-details-01 appearance, before animation. Compress the same geometry with
locally served, lazy decoder assets; keep the source pose, triangles/materials,
transparent poster, camera and motion/static policies unchanged. Include decoder
costs and failure paths in checks and measurements. No animation, publication,
PR update or deployment is included; this does not establish a device budget.

### Approved local introduction animation trial

After accepting the straight monitor and compact pointed-leaf plant, the owner
authorized subtle typing, occasional mouse movement and small posture shifts in
the introduction only. Preserve the model appearance and current local desk-height
rear camera with 30% smaller framing. No idle camera movement, new section art,
publication, PR update or deployment. Include a pause control, stop playback when
hidden/outside the intro, and keep reduced-motion and narrow stationary-3D opt-ins
unanimated. Reuse the approved transparent poster on loading/failure/static views.
This supersedes the no-animation boundary of the completed earlier checkpoints,
not the remaining requirements or unresolved physical-device performance budget.

The owner subsequently rejected the mouse/typing motion as unnatural and authorized
reworking the entire character animation, not merely increasing its amplitude.
Use articulated finger/wrist/elbow movement, grounded input contact, deliberate
keyboard/mouse handovers, varied timing and pauses, and restrained posture changes.
Keep the current character/device/prop appearance and framing; animation naturalness
is a new local visual checkpoint, not already accepted. Existing pause, visibility,
stationary/reduced-motion and error/static policies remain mandatory.

The latest local camera/prop trial restores the view directly behind the character
and the flag's original desktop position. The owner additionally authorized a light
breeze in the flag cloth, with the pole fixed and the star attached. Keep character
animation unchanged; the same pause/static/reduced-motion policies govern the flag.

The owner subsequently requested more recognizable travelling flag folds, rather
than the first slight bend, and occasional leg/foot animation. Keep the pinned flag
edge and attached upright star, stable seated hips, connected knee/ankle movement
and believable foot support. Do not add constant leg bouncing or change the camera,
props, upper-body work cycle or existing motion/fallback policies. This remains a
local visual trial pending acceptance; no new scene, publication or deployment.

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
