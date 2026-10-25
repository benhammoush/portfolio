# Portfolio design system

This local module applies Iris's ownership rules to the profile UI, not Iris's
visual identity or theme runtime.

- `tokens.css` owns shared profile colors, font, type sizes, spacing, radii and
  surface treatment, preserving existing values and token names.
- `base.css` owns global typography, defaults and focus treatment.
- `styles.css` loads shared defaults and component CSS before `src/styles.css`.
- `components/Card.*` owns the repeated article surface. Use the `index.ts`
  export; the owner supplies content, native attributes and grid placement.

Profile content, card-detail styling, navigation, buttons and layouts remain
product-owned. Standalone design studies under `src/design/` and the 3D world,
SVG artwork and canvas textures deliberately keep their own scoped art direction.
Their palettes are not competing definitions of the profile tokens. Shared UI
must not import those features. A light-only profile needs neither a theme
provider nor a typed token adapter.

Add shared components for actual presentation reuse, not every native element.
Keep their CSS colocated and feature overrides scoped. Run the existing quality
gates and affected browser suites, including profile keyboard/navigation and
narrow/wide layouts. Component tests cover native attributes and content;
browser checks verify rendered values and independent study styling. GPU checks
retain their existing separate scope; this is not real-device certification.
