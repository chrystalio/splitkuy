// components/ItemRow.test.tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ItemRow } from './ItemRow';
import { renderWithBill } from '@/test-utils/render-with-bill';
import { SummaryPanel } from './SummaryPanel';
import { useBill } from '@/hooks/useBill';
import type { Bill } from '@/lib/types';

const STORAGE_KEY = 'splitkuy_bill_v1';

function seedBill(bill: Bill) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
}

const itemFixture = (overrides: Partial<Bill['items'][0]> = {}) => ({
  id: 'i1',
  name: 'Americano',
  unitPrice: 25000,
  quantity: 1,
  assignments: [{ personId: 'p1', qty: 1 }],
  ...overrides,
});

const baseBill = (): Bill => ({
  people: [{ id: 'p1', name: 'Andi', isHost: true }],
  items: [itemFixture()],
  discounts: [],
  taxes: [],
  fees: [],
});

/**
 * Wrapper that reads the first item from context so tests can verify
 * state updates after dispatch (the prop alone wouldn't change).
 */
function LiveItemRow() {
  const { bill } = useBill();
  const item = bill.items[0];
  if (!item) return null;
  return <ItemRow item={item} />;
}

describe('ItemRow — collapsed view', () => {
  it('renders the item name, assignment summary, and subtotal', async () => {
    seedBill(baseBill());
    renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByText('Americano')).toBeInTheDocument();
    });
    expect(screen.getByText('Andi ×1')).toBeInTheDocument();
    expect(screen.getByText('Rp 25.000')).toBeInTheDocument();
  });

  it('renders an Edit button with a pencil icon (the discoverable affordance)', async () => {
    seedBill(baseBill());
    renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Americano/i })).toBeInTheDocument();
    });
  });

  it('shows "No one assigned" when assignments are empty', async () => {
    seedBill({
      ...baseBill(),
      items: [itemFixture({ assignments: [] })],
    });
    renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByText(/No one assigned/i)).toBeInTheDocument();
    });
  });
});

describe('ItemRow — edit affordance', () => {
  it('clicking Edit expands the form with all editable fields', async () => {
    seedBill(baseBill());
    const { user } = renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Americano/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Edit Americano/i }));
    expect(screen.getByLabelText('Item name')).toHaveValue('Americano');
    expect(screen.getByLabelText('Unit price (IDR)')).toHaveValue('25000');
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Cancel$/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Delete Americano/i })).toBeInTheDocument();
  });

  it('Save updates the item name and collapses the panel', async () => {
    seedBill(baseBill());
    const { user } = renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Americano/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Edit Americano/i }));
    await user.clear(screen.getByLabelText('Item name'));
    await user.type(screen.getByLabelText('Item name'), 'Cappuccino');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    await waitFor(() => {
      expect(screen.getByText('Cappuccino')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Item name')).toBeNull();
  });

  it('Save updates the price', async () => {
    seedBill(baseBill());
    const { user } = renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Americano/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Edit Americano/i }));
    await user.clear(screen.getByLabelText('Unit price (IDR)'));
    await user.type(screen.getByLabelText('Unit price (IDR)'), '30000');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    await waitFor(() => {
      expect(screen.getByText('Rp 30.000')).toBeInTheDocument();
    });
  });

  it('Cancel discards edits', async () => {
    seedBill(baseBill());
    const { user } = renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Americano/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Edit Americano/i }));
    await user.clear(screen.getByLabelText('Item name'));
    await user.type(screen.getByLabelText('Item name'), 'WRONG');
    const cancelButtons = screen.getAllByRole('button', { name: /^Cancel$/ });
    await user.click(cancelButtons[cancelButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getByText('Americano')).toBeInTheDocument();
    });
    expect(screen.queryByText('WRONG')).toBeNull();
  });

  it('Delete removes the item entirely', async () => {
    seedBill(baseBill());
    const { user } = renderWithBill(<>
      <LiveItemRow />
      <SummaryPanel />
    </>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Americano/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Edit Americano/i }));
    await user.click(screen.getByRole('button', { name: /Delete Americano/i }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Edit Americano/i })).toBeNull();
    });
  });

  it('Save button is disabled when the name is empty', async () => {
    seedBill(baseBill());
    const { user } = renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Americano/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Edit Americano/i }));
    await user.clear(screen.getByLabelText('Item name'));
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeDisabled();
  });

  it('shows a hint when no people exist to assign', async () => {
    seedBill({
      ...baseBill(),
      people: [],
      items: [itemFixture({ assignments: [] })],
    });
    const { user } = renderWithBill(<LiveItemRow />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Americano/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Edit Americano/i }));
    expect(screen.getByText(/Add a person to assign this item/i)).toBeInTheDocument();
  });
});
