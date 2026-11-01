# Dependency safeguards

The scoped `minimatch@10` override in `package.json` temporarily replaces the
development tooling's vulnerable glob matcher. It addresses
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) without
changing production dependencies or downgrading ESLint.

Remove the override when the lint consumers support the patched major directly.
Recheck file selection, typed/documentation rules and both dependency audits when
changing or removing it. `tests/tooling/dependency-override.test.mjs` guards that
linted source, tests and scripts are not silently excluded.
