/**
 * DOM matchers and cleanup shared by deterministic component tests.
 * @packageDocumentation
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
