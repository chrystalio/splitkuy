// vitest.setup.ts
// Runs before every test file. Wires jest-dom matchers and resets
// localStorage between tests so component state never bleeds.

import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});
