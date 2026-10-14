/**
 * Client route boundary for the foundation; designed product routes come later.
 * @packageDocumentation
 */
import { Route, Routes } from 'react-router-dom';
import FoundationPage from './FoundationPage';
import NotFoundPage from './NotFoundPage';

/**
 * Match the current browser URL without SSR, pre-rendering or canvas dependencies.
 * @returns The foundation route or a useful client-side recovery view.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FoundationPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
