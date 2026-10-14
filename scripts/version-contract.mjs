/**
 * Pure version contract shared by the CLI and negative regression fixtures.
 * @file
 */

/**
 * Reject malformed identities and drift across package, lock and runtime metadata.
 * @param pkg - Parsed application package manifest.
 * @param lock - Parsed npm lockfile, including the root package entry.
 * @param runtimeSource - Handwritten runtime module source, never evaluated here.
 * @throws {Error} When the runtime literal is missing, malformed or disagrees.
 */
export function assertVersionAlignment(pkg, lock, runtimeSource) {
  const matches = [
    ...runtimeSource.matchAll(
      /^export const APP_VERSION = ['"]([^'"]+)['"];$/gm,
    ),
  ];
  const version = pkg.version;
  // Require one unambiguous assignment and a release version without leading zeros.
  if (
    matches.length !== 1 ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
  ) {
    throw new Error(
      'Expected a semantic package version and one runtime version literal.',
    );
  }
  if (
    matches[0][1] !== version ||
    lock.version !== version ||
    lock.packages?.['']?.version !== version
  ) {
    throw new Error(
      'Package, runtime and both root lockfile versions must agree.',
    );
  }
}
