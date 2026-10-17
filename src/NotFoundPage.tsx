/**
 * Unknown-route recovery rendered by React, independently of HTTP fallback status.
 * @packageDocumentation
 */
import { Link } from 'react-router-dom';

/**
 * Provide a keyboard-usable way back without implying a server-generated 404.
 * @returns A semantic recovery page for routes absent from this foundation.
 */
export default function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>We couldn’t find that page. You can return to the portfolio home.</p>
      <Link to="/">Return to home</Link>
    </main>
  );
}
