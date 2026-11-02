/**
 * The approved product-first workspace replaces reading cards without losing HTML access.
 * @packageDocumentation
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '../../src/App';
import {
  PROJECTS,
  WORKFLOW_STEPS,
  workspacePath,
  workspaceViewFromHash,
} from '../../src/world/workspace-content';
import { SECTION_COPY } from '../../src/world/section-copy';

/** Render real route navigation against the fixture's document URL.
 * @returns The application inside its browser router.
 */
function Portfolio() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

test('the landing page has one explicit entry action and no room UI', () => {
  render(<Portfolio />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Guillaume Ammouche',
  );
  expect(
    document.querySelector(
      '.world-reading-layout,.world-anchor-rail,.world-copy-details',
    ),
  ).toBeNull();
  expect(screen.getByRole('link', { name: 'Enter portfolio' })).toHaveAttribute(
    'href',
    '/about',
  );
  expect(screen.queryByRole('heading', { name: 'About me' })).toBeNull();
  expect(document.documentElement).not.toHaveClass('world-snap');
  expect(document.querySelector('.monitor-workspace')).not.toHaveAttribute(
    'inert',
  );
  expect(
    document.querySelector('.world-header,.world-intro,.monitor-runway'),
  ).toBeNull();
});

test('About me is the default project pane with navigation immediately available', () => {
  render(<Portfolio />);
  fireEvent.click(screen.getByRole('link', { name: 'Enter portfolio' }));
  const skip = screen.getByRole('link', { name: 'Skip to content' });
  skip.focus();
  fireEvent.click(skip);
  expect(screen.getByRole('heading', { name: 'About me' })).toHaveFocus();
  expect(WORKFLOW_STEPS).toHaveLength(5);
  expect(
    screen.getByRole('region', { name: 'How I build software' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'How I build software', level: 2 }),
  ).toBeInTheDocument();
  expect(screen.getByText('My approach')).toBeInTheDocument();
  expect(
    screen.getByText('From the first question to a running application.'),
  ).toBeInTheDocument();
  for (const step of WORKFLOW_STEPS)
    expect(
      screen.getByRole('heading', { name: step.title, level: 3 }),
    ).toBeInTheDocument();
  expect(
    screen.getByRole('navigation', { name: 'Workspace navigation' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'About me' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(screen.queryByRole('button', { name: 'Explore projects' })).toBeNull();
  expect(document.documentElement).toHaveClass('workspace-open');
});

test('each project is one approved product sentence and consistently ordered stack metadata', () => {
  window.history.replaceState(null, '', '/about');
  render(<Portfolio />);
  for (const project of PROJECTS) {
    fireEvent.click(screen.getByRole('link', { name: project.label }));
    expect(
      screen.getByRole('heading', { name: project.label, level: 1 }),
    ).toHaveFocus();
    expect(document.querySelectorAll('.monitor-description')).toHaveLength(1);
    expect(screen.getByText(project.description)).toBeInTheDocument();
    expect(project.description.split(/\s+/).length).toBeLessThanOrEqual(22);
    expect(project.stack).toMatch(/^React \/ TypeScript/);
    expect(
      document.querySelector('.monitor-project-heading > span'),
    ).toBeNull();
    expect(screen.queryByText('04 selected projects')).toBeNull();
    expect(screen.queryByText('Interfaces → infrastructure')).toBeNull();
    expect(
      screen.getByRole('img', {
        name:
          project.id === 'iris'
            ? /Iris conceptual illustration, not/
            : new RegExp(`${project.label}.*screenshot`),
      }),
    ).toBeInTheDocument();
  }
  expect(PROJECTS[2].label).toBe('Solana Payments');
  expect(PROJECTS[2].description).toContain('on-chain transactions');
  expect(PROJECTS[3].description).toBe(
    'A cyberpunk NFT collection: discover, mint, explore rarity and shape its governance.',
  );
  expect(PROJECTS[3].stack).toBe('React / TypeScript / Python / Solidity');
});

test.each([
  ['apollo', 'apollo-frontend', 'apollo-backend'],
  ['iris', 'iris-frontend', 'iris-backend'],
  ['gateway', 'crypto_gateway_frontend', 'crypto_gateway_backend'],
  ['dripperz', 'dripperz', null],
])(
  'the %s project links to its real GitHub repositories',
  (id, frontend, backend) => {
    window.history.replaceState(null, '', `/projects/${id}`);
    render(<Portfolio />);
    const front = screen.getByRole('link', { name: 'Frontend on GitHub' });
    expect(front).toHaveAttribute(
      'href',
      `https://github.com/benhammoush/${frontend}`,
    );
    expect(front).toHaveAttribute('target', '_blank');
    expect(front).toHaveAttribute('rel', 'noopener noreferrer');
    if (backend) {
      const back = screen.getByRole('link', { name: 'Backend on GitHub' });
      expect(back).toHaveAttribute(
        'href',
        `https://github.com/benhammoush/${backend}`,
      );
      expect(back).toHaveAttribute('target', '_blank');
      expect(back).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.queryByText('Backend: not applicable')).toBeNull();
    } else {
      expect(
        screen.queryByRole('link', { name: 'Backend on GitHub' }),
      ).toBeNull();
      expect(screen.queryByText('Backend: not applicable')).toBeNull();
    }
  },
);

test.each([
  ['apollo', 'https://apollo-frontend-lime.vercel.app/'],
  ['iris', 'https://iris-frontend-production.vercel.app/'],
  ['gateway', 'https://crypto-gateway-production.vercel.app/'],
  ['dripperz', 'https://dripperz-production.vercel.app/'],
])('%s shows its production URL instead of a preview caption', (id, url) => {
  window.history.replaceState(null, '', `/projects/${id}`);
  render(<Portfolio />);
  const link = screen.getByRole('link', {
    name: `${url} ↗`,
  });
  expect(link).toHaveAttribute('href', url);
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(
    screen.queryByText(/Preview illustration · product screenshot pending/),
  ).toBeNull();
  if (id === 'iris')
    expect(
      screen.getByRole('img', { name: /Iris conceptual illustration/ }),
    ).toBeInTheDocument();
});

test.each(['about', 'projects'])(
  'the %s route opens About me inside the project explorer',
  (view) => {
    window.history.replaceState(null, '', `/${view}`);
    render(<Portfolio />);
    expect(screen.getByRole('heading', { name: 'About me' })).toHaveFocus();
    expect(
      screen.getByRole('navigation', { name: 'Workspace navigation' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About me' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(document.querySelector('.monitor-empty,.monitor-ready')).toBeNull();
    expect(screen.queryByText('Select a project to explore.')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Iris' }));
    expect(screen.getByRole('heading', { name: 'Iris' })).toHaveFocus();
    fireEvent.click(screen.getByRole('link', { name: 'About me' }));
    expect(screen.getByRole('heading', { name: 'About me' })).toHaveFocus();
  },
);

test('legacy links resolve to the new workspace and contact never depends on WebGL', () => {
  expect(workspaceViewFromHash('#world-profile')).toBe('about');
  expect(workspaceViewFromHash('#world-about')).toBe('about');
  expect(workspaceViewFromHash('#world-main')).toBe('about');
  expect(workspaceViewFromHash('#world-workflow')).toBe('about');
  expect(workspaceViewFromHash('#world-contact')).toBe('about');
  expect(workspaceViewFromHash('#world-projects')).toBe('about');
  expect(workspaceViewFromHash('#world-gateway')).toBe('gateway');
  expect(workspaceViewFromHash('#world-hub')).toBeNull();
  expect(workspaceViewFromHash('#unknown')).toBeNull();
  window.history.replaceState(null, '', '/#world-contact');
  render(<Portfolio />);
  expect(window.location.pathname).toBe('/about');
  expect(window.location.hash).toBe('');
  expect(workspacePath('iris')).toBe('/projects/iris');
  expect(screen.getByRole('link', { name: 'Email ↗' })).toHaveAttribute(
    'href',
    'mailto:guillaumeammouche@protonmail.com',
  );
});

test('legacy room history stays in content and unmount releases document styles', () => {
  window.history.replaceState(null, '', '/projects/apollo');
  const { unmount } = render(<Portfolio />);
  expect(document.documentElement).toHaveClass('workspace-open');
  expect(screen.queryByRole('button', { name: 'Back to the room' })).toBeNull();
  act(() => {
    window.history.replaceState(null, '', '/#world-hub');
    window.dispatchEvent(new Event('popstate'));
  });
  expect(document.documentElement).toHaveClass('workspace-open');
  expect(
    screen.getByRole('heading', { name: 'Guillaume Ammouche' }),
  ).toHaveFocus();
  fireEvent.click(screen.getByRole('link', { name: 'Enter portfolio' }));
  fireEvent.click(screen.getByRole('link', { name: 'Iris' }));
  expect(screen.getByRole('heading', { name: 'Iris' })).toBeInTheDocument();
  unmount();
  expect(document.documentElement).not.toHaveClass('monitor-route');
  expect(document.documentElement).not.toHaveClass('workspace-open');
});

test('the project picker opens the drawer and Escape restores focus to its trigger', () => {
  window.history.replaceState(null, '', '/about');
  render(<Portfolio />);
  const picker = screen.getByRole('button', { name: 'Choose project' });
  expect(picker).toHaveTextContent('04 projects');
  fireEvent.click(picker);
  expect(picker).toHaveAttribute('aria-expanded', 'true');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(picker).toHaveAttribute('aria-expanded', 'false');
  expect(picker).toHaveFocus();
});

test('all approved sections are parsed as plain text, without HTML interpretation', () => {
  expect(SECTION_COPY.map((section) => section.label)).toEqual([
    'Landing',
    'Introduction',
    'About me',
    'Engineering workflow',
    'Apollo',
    'Iris',
    'Solana Payments',
    'Dripperz',
    'Contact',
  ]);
  expect(() => JSON.stringify(SECTION_COPY)).not.toThrow();
});

test('history-driven route changes dismiss the drawer without reopening a previous view', () => {
  window.history.replaceState(null, '', '/about');
  render(<Portfolio />);
  const picker = screen.getByRole('button', { name: 'Choose project' });
  fireEvent.click(picker);
  for (const route of ['/projects/iris', '/about', '/projects/iris']) {
    act(() => {
      window.history.replaceState(null, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(picker).toHaveAttribute('aria-expanded', 'false');
    if (route === '/projects/iris') fireEvent.click(picker);
  }
});

test('the combined welcome keeps the short bio and all contact links', () => {
  window.history.replaceState(null, '', '/#world-workflow');
  render(<Portfolio />);
  expect(screen.getByRole('heading', { name: 'About me' })).toHaveFocus();
  expect(
    screen.queryByRole('heading', { name: 'Interfaces' }),
  ).not.toBeInTheDocument();
  expect(document.querySelectorAll('.monitor-about-intro')).toHaveLength(1);
  expect(
    screen.getByText(/I started my career as a BI developer in 2017/),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'GitHub ↗' })).toHaveAttribute(
    'href',
    'https://github.com/benhammoush',
  );
  expect(screen.getByRole('link', { name: 'Résumé (PDF) ↗' })).toHaveAttribute(
    'href',
    '/resume/Guillaume_Ammouche_CV_ATS.pdf',
  );
  expect(screen.getByRole('link', { name: 'Email ↗' })).toHaveAttribute(
    'href',
    'mailto:guillaumeammouche@protonmail.com',
  );
  expect(
    screen.queryByRole('link', { name: 'Workflow' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Contact' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'About me' }));
  expect(screen.getByRole('heading', { name: 'About me' })).toHaveFocus();
  expect(window.location.pathname).toBe('/about');
  expect(window.location.hash).toBe('');
});
