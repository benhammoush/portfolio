# Portfolio design system

Import `src/design-system/styles.css` once from the browser entry point. It loads
the terminal tokens, global base styles and shared native controls, in that order.
There is no JavaScript component API or theme provider: native links and buttons
already provide the semantics these screens need.

- `tokens.css` owns the terminal palette and monospace typography. The existing
  `--monitor-*` names are the public terminal color tokens, used across all routes.
- `base.css` owns reset, typography, selection, focus and route-recovery layout.
- `controls.css` owns `.skip-link` and `.monitor-primary`, shared by the landing
  and recovery pages; preserve native attributes, keyboard behavior and labels.
- `src/world/monitor.css` owns explorer/landing geometry, navigation states,
  responsive layouts, dialog layout and decorative effects. It consumes the shared
  foundations rather than redefining the terminal palette or controls.

Canvas globe colors and SVG artwork intentionally remain
local artwork rather than UI themes. Content and route behavior stay outside this
module. Add reusable components only when real presentation reuse warrants them.
