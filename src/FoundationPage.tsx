/**
 * Foundation smoke-test surface; designed pages and project claims come later.
 * @packageDocumentation
 */
import { APP_VERSION } from './appVersion';

/**
 * Show an honest build identity without suggesting that the portfolio is launched.
 * @returns A readable, motion-free foundation status page.
 */
export default function FoundationPage() {
  return (
    <main>
      <h1>Portfolio foundation</h1>
      <p>The local source and quality foundation is ready for verification.</p>
      <p>
        Designed pages, case studies, and the 3D world are not implemented yet.
      </p>
      <p>
        Version <span data-testid="app-version">{APP_VERSION}</span>
      </p>
    </main>
  );
}
