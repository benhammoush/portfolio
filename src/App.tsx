/**
 * Client route boundary for the profile shell; case-study routes come later.
 * @packageDocumentation
 */
import { Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import NotFoundPage from './NotFoundPage';
import DesignPage from './design/DesignPage';
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
      <Route path="/design" element={<DesignPage />} />
      <Route path="/world" element={<WorldPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
