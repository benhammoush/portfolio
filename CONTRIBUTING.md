# Contribution guide

Read the [product specification](spec/portfolio.md) and scope a bounded unit before
editing. Preserve unrelated work and distinguish local implementation, published
source, merged changes, deployed behavior and accepted evidence.

## Handwritten documentation

Write useful English documentation on every module and on substantial named
functions, internal helpers, components, hooks, classes, methods and type contracts.
TypeScript uses TSDoc-compatible comments with types in signatures, not duplicated
docblock types. JavaScript tooling uses JSDoc. Explain purpose, meaningful parameters,
results, failure/side effects, assumptions and edge cases. Describe why non-obvious
code exists; avoid mechanically restating a signature.

Use a first module docblock with `@packageDocumentation` in TypeScript or `@file`
in JavaScript. Parameters use `@param name - explanation`; non-void functions should
describe their result with `@returns`. Named arrow helpers need docs even when
internal. Trivial anonymous callbacks and declarative test cases do not each need
docblocks. ESLint makes presence/structure and TSDoc syntax blocking, with regression
tests in `tests/unit/documentation.test.mjs`. Review usefulness manually: lint does
not prove accuracy. Generated outputs alone are excluded, not handwritten tests.

## Before considering publication

The owner assigns a bounded task and authorizes its endpoint; no backlog pickup is automatic. The assistant owns implementation, affected checks, authorized PR publication and valid CI/CodeRabbit review repairs, including resuming paused reviews. `.coderabbit.yaml` enables approvals after completed review and disables author-triggered approval/resolve overrides. The owner decides when to merge after current-head checks and approval pass; no automatic merger, merge PAT or orchestration service is required.

Protect `main` with strict **Foundation quality** (GitHub Actions) and **CodeRabbit** checks bound to their respective apps, at least one approval, stale-review dismissal, independent last-push approval and resolved conversations. Enforce protections for administrators; block force pushes/deletion. Verify the integration and native settings separately: source configuration is not hosted enforcement, and a successful CodeRabbit status alone is not current-head approval.

After an authorized human merge, the existing main-push delivery workflow deploys dev when enabled. Verify the exact source/provider identity and affected behavior before reporting dev acceptance. Production remains a separate manually approved promotion of that exact dev-tested SHA under the [delivery runbook](docs/delivery.md); no deployment flags or permissions are enabled by ordinary publication.

1. Use the pinned Node/npm toolchain and `npm ci`.
2. Install the pinned Chromium binary and run `npm run check`.
   Also run `npm run audit:dependencies` and investigate reported findings; never
   apply a forced downgrade or override just to make audit output green.
3. Review metadata validation, privacy/asset rights, useful documentation and
   relevant negative tests; obtain a read-only code review after checks.
4. Request manual localhost verification or an explicit skip. Automated browser
   tests do not replace it. Keep versions deliberately aligned.
5. Stop at the accepted local checkpoint. Branch preparation, commits, pushes,
   PRs, protections and releases require separate authorization. An empty remote
   needs an agreed main bootstrap, not a PR against a nonexistent branch.

CI and Dependabot do not enforce remote branch policy or provision hosting. Review
dependency proposals for compatibility/security; Dependabot does not auto-merge or
deploy. Foundation CI runs checks only; the separate disabled-by-default delivery
workflow repeats selected-source checks before guarded dev delivery or approved
production promotion. See [delivery acceptance](spec/portfolio.md#delivery-foundation-acceptance)
and the [configuration/recovery runbook](docs/delivery.md). Remote enablement,
configuration, publication and deployment require separate authorization.
Future production release requires accepted exact-revision dev evidence, actual required
checks/protections, explicit approval and the accepted first-production recovery
policy or applicable verified previous-deployment recovery. See the delivery runbook.

## Browser rendering and lint coverage

Use the supported Vite/ESLint 10/TypeScript/React Hooks foundation, not the removed
Next.js lint bundle or legacy React/JSX accessibility plugins. The author explicitly
chose alignment with the other Vite foundations rather than a second static JSX
linter. Documentation presence/structure and TSDoc syntax remain blocking.
Keyboard/semantic shell smoke checks are not a replacement for complete accessibility
testing of future pages. Review that coverage in the appropriate feature slice.

Content requires JavaScript; test the static noscript notice without it. Direct
SPA routes need a hosting fallback, but missing assets must remain asset errors.
Local Vite preview is an inspection tool, not a production server or proof of
host rewrite behavior. Release configuration and deployed acceptance belong to
the separately authorized delivery/environment work.
