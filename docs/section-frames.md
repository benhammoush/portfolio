# Evidence anchors and section frames

Status: source-grounded proposal for review, before objects/animation. Follows the
approved order in [the section storyboard](section-storyboard.md). The running
prototype is unchanged. These frames are compositions of the **whole page**, not
rectangular 3D windows to place inside it. See the [layout contact sheet](section-frames.svg).

## Selected anchors and their actual status

| Section              | Selected anchor                                                               | What is established                                                                                                                            | What is not established here                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Introduction         | Name, role and concise positioning                                            | Owner-supplied CV supports the identity and React/TypeScript, Python/FastAPI stack                                                             | New portrait, logos, resume download or impact metrics                                                                              |
| Engineering workflow | One sanitized portfolio foundation delivery trace                             | Existing [acceptance/recovery record and production addendum](https://github.com/benhammoush/portfolio/issues/8) document the 0.1.0 foundation | Acceptance of the current local 0.3.0 design, uniform enforcement across other projects                                             |
| Apollo               | The approved [video destination](https://www.youtube.com/watch?v=7ox8NgQMjfM) | Destination already selected, subject to public-content review                                                                                 | Approval of an excerpt/still, timestamps, private architecture or performance claims; video contents were not reviewed in this step |
| Iris                 | Public-address search → wallet holdings/activity, including unpriced data     | Current read-only Solana spec, actual wallet component and browser-test source support this journey                                            | A newly captured/approved screenshot or live-data acceptance; test source is not proof a test just ran                              |
| Crypto gateway       | Actual checkout and its four progress labels                                  | Current frontend/backend docs and checkout source describe standalone USD-to-SOL, Solana Devnet-only, no real funds                            | Successful real-wallet settlement, production readiness, Shopify integration, carts or orders                                       |
| Contact              | Approved email destination                                                    | `guillaumeammouche@protonmail.com` supplied by the owner                                                                                       | Additional social links, response times or availability promises                                                                    |

### Iris capture target

Select **one real wallet-detail composition**, rather than squeezing the entire
dashboard into a decorative monitor. Show the public-address context, holdings and
activity, with priced versus unpriced information still distinguishable. A short
search-to-wallet sequence may support the still, but the still must explain the
section on its own.

The current Solana contract explicitly requires no wallet connection, signatures
or private keys. It preserves missing valuation as unavailable/unpriced, not zero.
Keep that distinction in the narrative. Do not reuse the historical Stacks-era CV
description as the current product UI.

Source grounding: Iris frontend `src/App.tsx`, `src/components/Wallet.tsx`,
`e2e/wallet.spec.ts`; current `iris-solana-migration.md` product contract. The browser
test source covers retained unpriced holdings and retry without discarding activity.
It was read, not executed, for this storyboard step.

Capture only through an approved sanitized fixture or approved public address,
retaining original UI colors and attribution/license obligations. Fixture captures
must be labeled as controlled demonstrations, not actual balances or live acceptance.
No new screenshot was taken or copied into portfolio assets in this step.

### Crypto gateway capture target

Use the **real checkout composition** alongside its exact customer-progress labels:

1. Awaiting wallet approval.
2. Transaction submitted.
3. Verifying on-chain.
4. Payment verified.

The key distinction is **submission is not settlement**. The gateway determines
verification; a browser redirect or wallet message is not the authority. A selected
uncertain/failure state can support this explanation only after its capture is
reviewed. The portfolio must not encourage another transfer while submission is uncertain.

Source grounding: gateway frontend `README.md` (Customer progress) and `src/App.tsx`;
backend `README.md` (scope/public contract). Both describe Solana Devnet only and no
real funds. The example has USD input and hosted SOL checkout; it is not commerce,
fulfillment, custody or an order system. Do not borrow the old 0x Shopify story.

Choose approved fixture captures for layout work unless separately authorized
wallet acceptance already supplies suitable sanitized evidence. This step ran no
wallet, signature, transaction, backend, provider or production-data operation.

### Apollo capture target

Use a **reviewed still from the approved video** as a possible dominant evidence
anchor, with the video available through explicit click-to-load and a normal link.
Do not invent the still or choose a timestamp without reviewing the video. Do not
autoplay, mount a third-party player on initial page load or disclose private source.

For now the frame says “approved evidence here”, not a fabricated Apollo screen.
The section needs one owner-approved engineering decision/tradeoff to accompany
that evidence. No internal architecture was inspected or reconstructed for these frames.

## Entry → reading → exit

These are content and layout states, not camera keyframes, animation durations or
performance budgets. Text/links remain HTML; original product imagery retains its
colors. No literal scene object is committed by the diagrams.

### 01 — Introduction

- **Entry:** name/role immediately visible; one large positioning headline creates
  hierarchy. Establish an open full-page world with readable space, not a project
  screenshot or the rejected Iris object as a universal hero.
- **Reading:** “From interface to production.” Supporting stack line and ordinary
  explore/contact links. The rest of the viewport establishes atmosphere without
  competing with identity.
- **Exit:** the invitation leads into the method. Keep visual continuity and bring
  the next section label into reading order; no wait, camera lock or click-to-enter.

### 02 — Engineering workflow

- **Entry:** a concise question answered by the section: how is a requirement turned
  into a checked, accepted result? Use a centered editorial composition, not the
  introduction's text-left/project-right arrangement again.
- **Reading:** three readable checkpoints across the page: **Define → Build and verify
  → Accept and deliver**. One small sanitized foundation trace supports them. AI is
  a supporting sentence about bounded assistance and human responsibility, not the
  visual hero or a claim of autonomous delivery.
- **Exit:** reduce process detail and hand off to “Apollo” as the first project story.
  Do not repeat the full workflow in every project chapter.

### 03 — Apollo

- **Entry:** a typographic project reveal and short problem statement; no speculative
  trading terminals or private-system visualizations.
- **Reading:** the approved evidence anchor has a broad, central role in the full
  page; concise contribution/decision text sits in clear space around it. A real
  HTML image/video can have bounds—this must not turn the _world_ into a boxed viewport.
  Ordinary media controls and the case-study link need to work independently of 3D.
- **Exit:** retain one takeaway about system-level engineering, not an invented
  performance result; lead into Iris as a user-facing information problem.

### 04 — Iris

- **Entry:** introduce a concrete exploration task before showing visual complexity:
  public address → understandable holdings/activity, without connecting a wallet.
- **Reading:** real wallet UI is the visual anchor, biased toward the left/center;
  short explanatory HTML uses clear space on the opposite side. Keep the selected
  interface readable rather than pinning a miniature dashboard inside a 3D monitor.
  Highlight one meaningful detail: **unpriced is not zero**.
- **Exit:** leave a clear user outcome and provenance/limitations. Transition from
  interpreting information to distinguishing payment states in the gateway.

### 05 — Crypto gateway

- **Entry:** a clear **Solana Devnet / no real funds** label and the actual checkout
  context, not floating coins or a shop that this product does not have.
- **Reading:** the checkout evidence and four state labels form one coherent
  composition. Give “submitted” and “verified” separate, unambiguous roles; all
  states remain readable without a scroll-driven simulation or wallet interaction.
- **Exit:** conclude on the responsibility to verify settlement, with the limitation
  label intact. No fake successful payment, celebration loop or invented receipt.

### 06 — Contact

- **Entry:** lower visual competition and return attention to the person behind the
  work. Keep the same space; do not introduce another sculpture.
- **Reading:** a short invitation and prominent approved email, with navigation back
  to the project sections/profile. No extra interaction needed to reach the link.
- **Exit:** no forced ending. Visitors can contact, revisit a chapter or leave normally.

## What this selects—and what it does not

Selected for the next review: identity; a sanitized delivery trace; Apollo video
destination as a review-gated candidate; Iris's real public-wallet UI; the gateway's
actual checkout/state sequence; email contact. Real image captures/excerpts remain
to be selected and approved, not silently replaced with invented screens.

Review these evidence anchors and spatial frames before choosing objects/materials
or camera choreography. That next step should explore ways the selected content
inhabits the page, not another unrelated exhibition machine. No new models,
application routes, asset publication, cross-project edits or deployment are included.
