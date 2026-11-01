/**
 * Client route boundary for the portfolio, retained profile and recovery view.
 * @packageDocumentation
 */
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import NotFoundPage from './NotFoundPage';
import WorldPage from './world/WorldPage';
import {
  PROJECTS,
  workspacePath,
  workspaceViewFromHash,
} from './world/workspace-content';

/**
 * Match the current browser URL without SSR, pre-rendering or canvas dependencies.
 * @returns The foundation route or a useful client-side recovery view.
 */
export default function App() {
  const { pathname, search, hash } = useLocation();
  if (
    (pathname === '/' || /^\/world\/?$/.test(pathname)) &&
    hash.startsWith('#world-')
  ) {
    const view = workspaceViewFromHash(hash);
    return (
      <Navigate
        to={{ pathname: view ? workspacePath(view) : '/', search }}
        replace
      />
    );
  }
  if (
    /^\/about\/?$/.test(pathname) &&
    ['#about', '#expertise', '#contact'].includes(hash)
  )
    return <Navigate to={{ pathname: '/profile', search, hash }} replace />;
  return (
    <Routes>
      <Route path="/" element={<WorldPage />} />
      <Route path="/about" element={<WorldPage view="about" />} />
      {PROJECTS.map((project) => (
        <Route
          key={project.id}
          path={workspacePath(project.id)}
          element={<WorldPage view={project.id} />}
        />
      ))}
      <Route
        path="/projects"
        element={<Navigate to={{ pathname: '/about', search }} replace />}
      />
      <Route path="/profile" element={<HomePage />} />
      <Route
        path="/world"
        element={<Navigate to={{ pathname: '/', search }} replace />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
