# Dev → production delivery

## Versioned CI/CD entry points

Automation 3.0 removes production deployment opt-ins; dev remains automatic.
The verified immutable v3.0.0 release is pinned below. Delete obsolete live
deployment flags only after this consumer adoption is merged and verified.

The [shared contract](https://github.com/benhammoush/ci-cd-workflows/blob/main/docs/contract.md)
is pinned in `.github/ci-cd.json`. `ci.yml` checks PRs/main and delivers successful
exact main commits to dev without an opt-in switch. Manual `deploy-production.yml` selects a full
merged `sha`, requires retained successful dev evidence, verifies the candidate,
then waits for native approval. CI dispatch is the exact-SHA dev recovery path.
These supersede older combined-workflow invocations below, not existing hosting,
identity, human acceptance or recovery requirements.

The current immutable foundation pin selects v3.0.0, including bounded Ubuntu browser-host
dependency installation from the official HTTPS archive. Portfolio retains its
locked Playwright version, browser suites and fail-closed verification gate.

All Ubuntu jobs use `ubuntu-24.04`. Built-output browser checks now cover Chromium,
Firefox and WebKit for core HTML, navigation, accessibility, responsive reading,
illustrative screens and failure recovery. Specialized WebGL/camera/monitor suites
retain their complete original Chromium coverage rather than claiming GPU parity
across engines. Shared artifact/record integrity supplements existing routing
and configuration smoke. `lockScope: all` preserves stricter cross-target exclusion.
Neither target uses `DEPLOY_ENABLED` or the legacy repository-level
`DELIVERY_ENABLED` fallback; absent/false values do not skip delivery.
Production remains manual and natively approved. No live flag or credential is changed
here. Existing required-check names remain compatible. Historical sources without
versioned hooks fail closed; immutable artifact recovery is separately authorized.
PR checks do not certify live delivery, real devices or owner acceptance.

## Status and authorization

This is a **local implementation**, not a provisioned or operationally verified
release mechanism. No public launch is authorized. Successful main verification
automatically starts dev delivery; missing configuration or credentials fail closed.
Production retains manual dispatch, dev evidence and native approval without a boolean opt-in.
There is no active staging target. Do not delete historical resources, revoke
shared credentials or change other projects as part of this slice.

The static foundation remains `0.1.0`; no product feature or launch version is
implied by delivery tooling. Future shipped application changes follow the version
contract. Credentials must never enter Git, release metadata or evidence records.

## Mechanism

- `ci.yml` checks PRs and protected-main pushes; only a successful exact main
  commit can automatically deliver dev. Its manual dispatch **from main** selects
  an exact full merged SHA for dev revalidation/recovery. Production uses only
  `deploy-production.yml` with an exact dev-accepted merged SHA and retained
  successful dev-delivery evidence. Both paths run dependency audits, quality and
  built-output browser checks before deployment. `Foundation quality` remains the
  existing required CI name, not a deployment or acceptance claim. The superseded
  `delivery.yml` is removed rather than retained as a competing trigger.
- Delivery tooling is checked out from the workflow revision, separately from the
  selected application revision in `candidate/`. Old source still needs to pass
  the current hosting/identity contract; an arbitrary old commit is not guaranteed
  to be eligible. No PR/unmerged-source delivery is supported.
  Before candidate checkout or any candidate-controlled install/check command, a
  trusted source gate verifies main ancestry using the read-only `GITHUB_TOKEN`.
  The later deployment guard repeats this check. Step-scoped secrets alone are
  not runner isolation; unmerged code must never execute earlier on this runner.
- Two disconnected Vercel projects are used: each logical target uses its own
  project's **production** slot. Thus `--prod` on the dev project deploys shared
  dev, not portfolio production. Vercel preview/custom environments are not
  additional portfolio targets. Connected Git projects are rejected, preventing a
  competing Git auto-deployment path. Inventory/disable deploy hooks and other
  writers separately before enabling this mechanism.
- Native GitHub `production` required-reviewer approval is mandatory, self-review
  allowed, administrator bypass disabled. GitHub enforces the environment gate
  before the job starts. The operator must read back actual policies using the
  local authenticated CLI/API during setup/readiness, before authorizing enablement
  or promotion and after policy/access changes. Unsupported/missing controls or
  uncertain evidence block authorization, not silently fall back to a boolean input
  or custom approval checkbox. The controller does not query GitHub policy or review
  history APIs and cannot detect later policy drift or a deleted/recreated environment.
  Production reruns are rejected: start a new dispatch and
  obtain fresh approval after diagnosing a failure. The approval is requested before
  the environment job starts; the approver must inspect the exact run inputs and
  acceptance record. Rejected runs must not be bypassed or retried as dev.
- The shared `deploy-<owner>-<repository>-all` job lock (`lockScope: all`)
  serializes both targets, preserving stricter cross-target exclusion.
  Dev acceptance is reviewed manually.
  Active runs are not cancelled by newer runs. GitHub may replace pending runs;
  this is not a FIFO delivery queue. Immediately before mutation, automatic dev
  runs reject a source superseded by current main. A main update after that read
  may finish the active deployment before its successor; do not cancel an active
  mutation. All future recovery jobs must use the same shared lock.
- Only checked `dist` plus generated public `release.json` are uploaded from a
  fresh Build Output API v3 staging tree through the pinned foundation's fixed-origin
  Vercel API transport. No source/config secrets are uploaded and no provider-side
  application build or dynamically downloaded Vercel CLI runs. Upload and deployment
  mutations are not retried; reassess transport provenance on foundation upgrades.
- Both targets remain `noindex, nofollow`, including provider URLs. This is not
  access control. Filesystem-first routing serves existing files, returns errors
  for missing assets/file-like requests, and falls back to the HTML shell for app
  routes. Unknown application routes may return HTTP 200 with client recovery.
  The hosted HTTP smoke hook checks identity and routing; it does not replace
  browser/accessibility checks or human acceptance.

## Separately authorized configuration checklist

Current owner decisions (2026-10-16): both foundation targets may be publicly
reachable with `noindex, nofollow`; this is not authorization for public launch.
First-production recovery policy is accepted as described below; production
execution remains deferred. These decisions do not authorize publication or
deployment. Do not merge automatic dev delivery until dev configuration and
readiness are accepted: `DELIVERY_ENABLED=false` cannot pause dev. For a dev
maintenance pause, freeze main pushes/merges, manual CI dispatches and workflow reruns, then let
queued and active deliveries finish under the mutation lock before starting work.
Never cancel an active mutation. Hold production by not dispatching it until separately authorized.

Before remote enablement, obtain decisions/evidence for:

1. Vercel account, two distinct owned project IDs, target domains and access policy.
   Decide whether dev is authenticated or public-but-unlisted; noindex alone does
   not make drafts private. Confirm production hosting of the foundation is allowed
   without treating it as public launch. Test provider URL protection too.
2. Actual protected-main `Foundation quality` check, agreed review count/bypass
   policy, force-push/deletion controls and provider access isolation. Do not assume
   these from YAML or an old CI run. Main/environment governance and other provider
   writers are prerequisite evidence reviewed by humans, not enforced by controller
   policy reads. Use the owner's local CLI/API login without copying it into Actions.
3. Native production approvals available on the repository/account plan, named
   required reviewers, self-review allowed and administrator bypass disabled.
   Retain dated non-secret policy readback before authorizing enablement or promotion
   and after policy/access changes. Missing/uncertain evidence blocks authorization;
   discovered drift requires separately authorized correction before delivery resumes.
   Do not cancel an active mutation. Verify actual enforcement with a controlled run
   before claiming readiness; the script cannot enforce this operator prerequisite.
4. Disconnect Vercel Git deployment, inventory/disable other automatic paths and
   deploy hooks, and authorize credential/project setup separately. Do not disable
   unrelated consumers. Protect environment variables and credentials against PR
   access; environment deployment branches must restrict execution to main.
5. Retain these decisions and dated setup checks for the owner's readiness review.
   No dedicated readiness URL or environment variable is required by the controller;
   operator verification and authorization remain prerequisites to enablement.

Repository variables (nonsecret):

| Name                                      | Meaning                               |
| ----------------------------------------- | ------------------------------------- |
| `DEV_PROJECT_ID`, `PRODUCTION_PROJECT_ID` | Distinct immutable `prj_` identities  |
| `DEV_ORIGIN`                              | Approved HTTPS shared-dev origin      |
| `DEV_CONFIG_ID`                           | Reviewed dev configuration generation |

Each GitHub environment, `dev` and `production`, additionally provides:

| Name                 | Meaning                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `VERCEL_ORG_ID`      | Confirmed provider `team_` identity                               |
| `VERCEL_PROJECT_ID`  | This environment's exact project, matching repository identity    |
| `TARGET_ORIGIN`      | Approved HTTPS origin, no path/query/credentials                  |
| `DELIVERY_CONFIG_ID` | Reviewed configuration generation; dev must equal `DEV_CONFIG_ID` |

Environment secrets:

- `VERCEL_TOKEN`: a separate project-scoped provider credential for each target.
  Dev's token is restricted to the dev project; production's token is restricted
  to the production project. Do not use team-wide or full-account tokens.
  Password-manager labels use `<project>-<environment>-<provider>-<purpose>`,
  for example `portfolio-production-vercel-deploy`; GitHub keeps `VERCEL_TOKEN`.
- Production receives no dev-verification token. The owner verifies the accepted
  dev candidate and recovery manually before native approval. Vercel project-scoped
  tokens grant project read/write access, not read-only authorization. Verify scopes
  and expiry without recording values; remove obsolete credentials only after
  separately authorized consumer inventory and cleanup.
- `SMOKE_BYPASS`: optional approved Vercel automation access secret for this
  target only. Production does not receive a dev access credential.
  Requests do not follow redirects or put bypass credentials in URLs.
  These are deployment-access credentials, never approval bypasses. Their
  existence/use requires authorization; the workflow does not generate them.

No additional GitHub personal access token is required. The built-in `GITHUB_TOKEN`
with `contents: read` handles source ancestry/freshness checks both before candidate
execution and during delivery; `actions: read` retrieves exact-SHA dev-delivery
evidence. It is not used for administration readback. Keep the
owner's broader CLI credential local; native approval policy is verified by the
operator rather than by a token copied into Actions. The pure approval validator
supports setup readback, not runtime controller enforcement.

The configuration digest covers project/account identity, known protection
settings, target origin and a reviewed generation. It is **not** a complete provider
configuration inventory. Bump the generation after any relevant external policy,
domain, credential/access or application configuration change, update the readiness
record, and repeat affected dev acceptance. Dev's environment generation and
repository `DEV_CONFIG_ID` must change together. Config changes during acceptance
invalidate it. Do not store raw provider responses, tokens or secret values as
evidence; fingerprints are not proof of human approval.

## Dev acceptance and production promotion

1. After a protected-main merge, inspect the delivery run for its exact SHA/version,
   configuration digest, Vercel deployment ID and previous deployment ID. A manual
   dev redeploy selects an explicit merged SHA and repeats checks. It can select an
   older source deliberately; it must not be mistaken for automatic freshness.
2. Run a dev browser/device walkthrough covering foundation page/version, reload,
   back/forward and keyboard recovery, JavaScript-disabled notice, asset failures
   and approved access/indexing. Record actual observed results and limitations.
3. Perform the applicable **application-only** rollback rehearsal below, then
   restore the selected candidate and repeat affected acceptance. If shared dev
   changes during acceptance, restart affected checks for the selected candidate.
4. Retain a dated HTTPS acceptance record with exact source/version/configuration,
   dev deployment identity, walkthrough, smoke and recovery results/limitations,
   acceptance decision and reviewer. Do not publish private screenshots or raw
   operational exports in this public repository. A URL alone proves none of this.
5. Dispatch **Deploy production** (`deploy-production.yml`) from main with the
   exact dev-accepted `sha`; retained successful dev-delivery evidence must match.
   The native approver must review the record's actual contents and current dev
   identity. Reject incomplete/mismatched acceptance; the workflow cannot determine
   whether an arbitrary evidence record is truthful or approved.
6. Immediately before native approval, the owner rechecks the current dev deployment,
   source/version/configuration, acceptance and recovery records. Any intervening
   deployment/configuration change requires affected acceptance again. The script
   does not query dev, validate a custom promotion manifest or prove acceptance.
   It retains source ancestry/freshness and selected-target safety checks.
   Target-specific builds need not have the same deployment ID or bytes.
7. Retain the sanitized run-summary checkpoints **before** and after mutation.
   They include prior identity even when creation/smoke fails. Confirm hosted
   browser/version behavior with read-only production acceptance. HTTP smoke passes
   are not final product acceptance. Do not auto-rollback on a smoke failure.

## Recovery and first deployment

Recovery is an independently authorized operation, not an automatic retry path.
The workflow intentionally does not contain destructive cleanup, resource deletion,
credential revocation or production-data mutation.

Before any deployment, retain the last known-good provider deployment ID, source,
version, target/configuration generation and evidence when a prior deployment exists;
otherwise explicitly record that none exists. Export accepted run-summary
identities to the approved durable operational record before workflow retention
expires. A failed/timeout run may already have changed hosting: inspect provider
state and alias pointers before retrying. Never infer failure means no mutation.

For a dev application rollback rehearsal:

1. Authorize a maintenance window; prevent competing deliveries using the same
   mutation lock or an explicitly approved pause, and verify no active mutation.
   Do not cancel a running deployment. Dev ignores repository/environment enable
   flags; they cannot pause future automatic delivery or stop already-started work.
2. Verify the prior deployment belongs to the same target project, is still
   available/eligible, has compatible accepted configuration and serves the
   expected source/version. Record the selected current candidate too.
3. Using a separately authorized provider recovery operation, restore the eligible
   previous application deployment. Inspect resulting production-slot/domain
   pointers; verify identity, routes, assets, access and basic browser behavior.
   Do not touch persistent data. Record the exact operation/result, not only intent.
4. Restore the selected dev candidate by its retained provider identity, or manually
   redeploy its exact merged source if provider recovery requires it. A redeploy
   creates a **new** candidate identity and requires updated acceptance. Revalidate
   before promotion. Never reuse acceptance for the displaced deployment.

Production recovery follows the same identity/configuration prechecks and explicit
authorization, with production approval policy intact and read-only verification
after recovery. There is no ungated recovery workflow or instruction to bypass
native approvals. Choose the supported provider operation only after current
capabilities/eligibility are verified; these files do not certify one.

On the first deployment, `previous: null` means **no rollback candidate exists**.
Do not invent an ID or report rehearsal success. A second dev candidate can
establish a real rehearsal path without claiming the first had one.

### Accepted first-production recovery policy (2026-10-16)

The owner accepts the absence of a previous production deployment for the first
production release, under these safeguards:

1. Before first production, complete dev acceptance and a real application rollback
   rehearsal using an eligible previous dev deployment. Restore the selected dev
   candidate and repeat affected acceptance before promotion.
2. If first production fails or times out, stop. Inspect actual deployment state
   and domain/alias pointers; failure does not prove that hosting was unchanged.
   Retain the available identity/checkpoint evidence and diagnose before recovery.
3. With separate recovery authorization, start a **new** production dispatch from
   main selecting an exact merged, dev-accepted revision. Recheck dev acceptance,
   configuration and recovery evidence and obtain fresh native production approval.
   Changed source or configuration requires affected dev acceptance again. Do not
   rerun the failed production run, bypass approval, blindly retry, or mutate
   production data. Recovery remains blocked if no eligible dev-accepted revision
   is available.
4. Once production is accepted, retain its provider deployment ID, source/version,
   configuration and acceptance evidence as the rollback candidate for later
   releases. Recheck availability and compatibility before any later rollback;
   retention alone does not establish future eligibility.

This resolves the initial recovery-policy decision only. It does not claim a dev
rehearsal or production deployment has occurred and does not authorize publication,
enablement, deployment or recovery execution.
