// components/SummaryPanel.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SummaryPanel } from './SummaryPanel';
import { renderWithBill } from '@/test-utils/render-with-bill';
import type { Bill } from '@/lib/types';

const STORAGE_KEY = 'splitkuy_bill_v1';

function seedBill(bill: Bill) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
}

const twoPersonBugScenario: Bill = {
  people: [
    { id: 'p1', name: 'Kris', isHost: true },
    { id: 'p2', name: 'Elia' },
  ],
  items: [
    {
      id: 'i1', name: 'Americano J', unitPrice: 32000, quantity: 1,
      assignments: [{ personId: 'p1', qty: 1 }],
    },
    {
      id: 'i2', name: 'Americano R', unitPrice: 20000, quantity: 1,
      assignments: [{ personId: 'p2', qty: 1 }],
    },
  ],
  discounts: [{ id: 'd1', label: 'Promo', amount: 10000 }],
  taxes: [],
  fees: [{ id: 'f1', label: 'Service', amount: 25000 }],
};

describe('SummaryPanel — 2026-08-24 bug scenario', () => {
  beforeEach(() => {
    seedBill(twoPersonBugScenario);
  });

  it('renders both people and their final owed amounts', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByText('Kris')).toBeInTheDocument();
    });
    // Bug-report scenario: Kris owes 38.346, Elia owes 28.654.
    // Sum = 67.000 = subtotal 52.000 - discount 10.000 + fees 25.000.
    expect(screen.getByText('Rp 38.346')).toBeInTheDocument();
    expect(screen.getByText('Rp 28.654')).toBeInTheDocument();
  });

  it('renders the grand total in the header', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByText('Rp 67.000')).toBeInTheDocument();
    });
  });

  it('shows the host label only on the host', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByText('Kris')).toBeInTheDocument();
    });
    // Kris is host → host label appears next to Kris.
    expect(screen.getByText(/host/i)).toBeInTheDocument();
    // Elia is not host → no second host label.
    const hostLabels = screen.getAllByText(/host/i);
    expect(hostLabels).toHaveLength(1);
  });

  it('renders the items assigned to each person', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByText('Americano J')).toBeInTheDocument();
    });
    expect(screen.getByText('Americano R')).toBeInTheDocument();
  });

  it('renders the per-person Discounts and Fees lines (the bug fix)', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getAllByText(/Discounts:/).length).toBeGreaterThan(0);
    });
    // Each person should have their share visible inline.
    expect(screen.getAllByText(/Discounts:/)).toHaveLength(2);
    expect(screen.getAllByText(/Fees:/)).toHaveLength(2);
  });

  it('copy button is enabled when there are items', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy summary/i })).toBeEnabled();
    });
  });
});

describe('SummaryPanel — empty bill', () => {
  beforeEach(() => {
    seedBill({
      people: [],
      items: [],
      discounts: [],
      taxes: [],
      fees: [],
    });
  });

  it('renders no per-person summary rows', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      // The "host" label is rendered per-person via the · host suffix;
      // with an empty bill there should be no host markers anywhere.
      expect(screen.queryByText(/host/i)).toBeNull();
    });
  });

  it('disables the copy button when no items exist', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy summary/i })).toBeDisabled();
    });
  });

  it('disables the reset button when bill is empty', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset bill/i })).toBeDisabled();
    });
  });
});

describe('SummaryPanel — negative grand total', () => {
  beforeEach(() => {
    seedBill({
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [{
        id: 'i1', name: 'Nasi', unitPrice: 10000, quantity: 1,
        assignments: [{ personId: 'p1', qty: 1 }],
      }],
      discounts: [{ id: 'd1', label: 'Big Promo', amount: 50000 }],
      taxes: [],
      fees: [],
    });
  });

  it('shows the amber warning banner when discounts exceed subtotal', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Discounts exceed subtotal/i)).toBeInTheDocument();
    });
  });

  it('clamps the final owed to Rp 0', async () => {
    renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      // Person should owe Rp 0 (clamped) — not a negative number.
      expect(screen.getByText('Rp 0')).toBeInTheDocument();
    });
  });
});

describe('SummaryPanel — reset flow', () => {
  beforeEach(() => {
    seedBill(twoPersonBugScenario);
  });

  it('opens a confirm dialog when reset is clicked', async () => {
    const { user } = renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset bill/i })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: /reset bill/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/Reset the entire bill\?/i)).toBeInTheDocument();
  });

  it('clears the bill when confirm is clicked', async () => {
    const { user } = renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByText('Kris')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /reset bill/i }));
    await user.click(screen.getByRole('button', { name: /^Reset$/ }));
    // After reset, no person names should remain.
    await waitFor(() => {
      expect(screen.queryByText('Kris')).toBeNull();
    });
  });

  it('does not clear the bill when cancel is clicked', async () => {
    const { user } = renderWithBill(<SummaryPanel />);
    await waitFor(() => {
      expect(screen.getByText('Kris')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /reset bill/i }));
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.getByText('Kris')).toBeInTheDocument();
    });
  });
});
