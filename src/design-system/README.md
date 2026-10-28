# Portfolio design system

This module owns shared tokens, base styles and reusable components for the
portfolio profile UI.

- `tokens.css` owns shared profile colors, font, type sizes, spacing, radii and
  surface treatment, preserving existing values and token names.
- `base.css` owns global typography, defaults and focus treatment.
- `styles.css` loads shared defaults and component CSS before `src/styles.css`.
- `components/Card.*` owns the repeated article surface. Use the `index.ts`
  export; the owner supplies content, native attributes and grid placement.

Profile content, card-detail styling, navigation, buttons and layouts remain
product-owned. The 3D world, SVG artwork under `src/artwork/` and canvas textures
deliberately keep their own scoped art direction.
Their palettes are not competing definitions of the profile tokens. Shared UI
must not import those features. A light-only profile needs neither a theme
provider nor a typed token adapter.

Add shared components for actual presentation reuse, not every native element.
Keep their CSS colocated and feature overrides scoped. Run the existing quality
gates and affected browser suites, including profile keyboard/navigation and
narrow/wide layouts. Component tests cover native attributes and content;
browser checks verify rendered profile values and responsive layouts. GPU checks
retain their existing separate scope; this is not real-device certification.
