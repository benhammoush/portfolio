/**
 * Client route boundary for the profile shell; case-study routes come later.
 * @packageDocumentation
 */
import { Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import NotFoundPage from './NotFoundPage';
import DesignPage from './design/DesignPage';
import HeroStudyPage from './design/HeroStudyPage';
import SceneStudyPage from './design/SceneStudyPage';
import WorkflowScreenPage from './design/WorkflowScreenPage';
import ApolloScreenPage from './design/ApolloScreenPage';
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
      <Route
        path="/hero-study"
        element={<HeroStudyPage direction="editorial" />}
      />
      <Route
        path="/hero-study/immersive"
        element={<HeroStudyPage direction="immersive" />}
      />
      <Route path="/world" element={<WorldPage />} />
      <Route path="/screen-study/workflow" element={<WorkflowScreenPage />} />
      <Route path="/screen-study/apollo" element={<ApolloScreenPage />} />
      <Route path="/scene-study" element={<SceneStudyPage chapter="intro" />} />
      <Route
        path="/scene-study/workflow"
        element={<SceneStudyPage chapter="workflow" />}
      />
      <Route
        path="/scene-study/iris"
        element={<SceneStudyPage chapter="iris" />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
