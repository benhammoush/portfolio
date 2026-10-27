/**
 * Client route boundary for the portfolio, retained profile and recovery view.
 * @packageDocumentation
 */
import { Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import NotFoundPage from './NotFoundPage';
import WorldPage from './world/WorldPage';

/**
 * Match the current browser URL without SSR, pre-rendering or canvas dependencies.
 * @returns The foundation route or a useful client-side recovery view.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WorldPage />} />
      <Route path="/about" element={<HomePage />} />
      <Route path="/world" element={<WorldPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
