// components/BillContext.test.tsx
// Tests the BillContext hydration gate, persistence, and reset integration.
// BillContext is a React context provider; we test it through its consumers.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SummaryPanel } from './SummaryPanel';
import { PeopleSection } from './PeopleSection';
import { renderWithBill } from '@/test-utils/render-with-bill';
import { loadBill } from '@/lib/storage';
import { useBill } from '@/hooks/useBill';
import type { Bill } from '@/lib/types';

const STORAGE_KEY = 'splitkuy_bill_v1';

function seedBill(bill: Bill) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
}

function readStoredBill(): Bill | null {
  return loadBill();
}

function TestConsumer() {
  const { bill } = useBill();
  return (
    <div>
      <span data-testid="people-count">{bill.people.length}</span>
      <span data-testid="items-count">{bill.items.length}</span>
    </div>
  );
}

describe('BillContext — hydration gate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children after the first render (microtask-level hydration)', async () => {
    renderWithBill(<TestConsumer />);
    // useEffect runs synchronously after render in tests; after a single
    // microtask the provider has consulted localStorage and mounted children.
    await waitFor(() => {
      expect(screen.getByTestId('people-count')).toBeInTheDocument();
    });
  });

  it('loads a saved bill on mount', async () => {
    seedBill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [],
      discounts: [],
      taxes: [],
      fees: [],
    });
    renderWithBill(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('people-count')).toHaveTextContent('1');
    });
  });

  it('renders empty state when no bill is saved', async () => {
    renderWithBill(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('people-count')).toHaveTextContent('0');
    });
  });
});

describe('BillContext — persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes to localStorage when bill state changes', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText('Andi')).toBeInTheDocument();
    });
    const stored = readStoredBill();
    expect(stored).not.toBeNull();
    expect(stored!.people).toHaveLength(1);
    expect(stored!.people[0].name).toBe('Andi');
  });

  it('persists host designation across renders', async () => {
    const { user } = renderWithBill(<PeopleSection />);
    await waitFor(() => {
      expect(screen.getByText(/No people yet/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Andi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await user.type(screen.getByPlaceholderText(/add person name/i), 'Budi');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeInTheDocument();
    });
    // Promote Budi to host.
    await user.click(screen.getByRole('button', { name: /Set Budi as host/i }));
    await waitFor(() => {
      const stored = readStoredBill();
      expect(stored!.people.find((p) => p.name === 'Budi')?.isHost).toBe(true);
    });
  });
});

describe('BillContext — reset persists empty bill', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes an empty bill to localStorage after reset (so state is consistent)', async () => {
    seedBill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [],
      discounts: [],
      taxes: [],
      fees: [],
    });
    const { user } = renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByText('Andi')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /reset bill/i }));
    await user.click(screen.getByRole('button', { name: /^Reset$/ }));
    await waitFor(() => {
      expect(screen.queryByText('Andi')).toBeNull();
    });
    const stored = readStoredBill();
    expect(stored?.people).toHaveLength(0);
    expect(stored?.items).toHaveLength(0);
  });
});
