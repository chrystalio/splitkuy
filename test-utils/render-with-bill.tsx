// test-utils/render-with-bill.tsx
// Helper for rendering components inside a fresh BillProvider so tests
// get a real localStorage-backed context without sharing state across cases.

import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { BillProvider } from '@/components/BillContext';

export function renderWithBill(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();
  const result = render(ui, {
    wrapper: BillProvider,
    ...options,
  });
  return { ...result, user };
}
