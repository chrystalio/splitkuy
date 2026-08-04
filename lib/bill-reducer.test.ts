import { describe, it, expect } from 'vitest';
import {
  billReducer,
  emptyBill,
  type BillAction,
} from './bill-reducer';

function act(initial: ReturnType<typeof emptyBill>, action: BillAction) {
  return billReducer(initial, action);
}

const base = () => emptyBill();

describe('billReducer', () => {
  it('ADD_PERSON makes the first person the host', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    expect(state.people).toHaveLength(1);
    expect(state.people[0].isHost).toBe(true);
  });

  it('ADD_PERSON does not host subsequent people', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Budi' } });
    expect(state.people).toHaveLength(2);
    expect(state.people[1].isHost).toBe(false);
  });

  it('REMOVE_PERSON strips assignments and reassigns host to people[0]', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Budi' } });
    const [host, other] = state.people;
    state = act(state, {
      type: 'ADD_ITEM',
      payload: {
        name: 'Nasi',
        unitPrice: 1000,
        quantity: 2,
        assignments: [
          { personId: host.id, qty: 1 },
          { personId: other.id, qty: 1 },
        ],
      },
    });
    state = act(state, { type: 'REMOVE_PERSON', payload: { id: host.id } });
    expect(state.people).toHaveLength(1);
    expect(state.people[0].id).toBe(other.id);
    expect(state.people[0].isHost).toBe(true);
    expect(state.items[0].assignments).toHaveLength(1);
    expect(state.items[0].assignments[0].personId).toBe(other.id);
  });

  it('REMOVE_PERSON of the last person leaves an empty people array', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'REMOVE_PERSON', payload: { id: state.people[0].id } });
    expect(state.people).toHaveLength(0);
    expect(state.items).toHaveLength(0);
  });

  it('SET_HOST leaves exactly one host', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Budi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Citra' } });
    const budi = state.people[1];
    state = act(state, { type: 'SET_HOST', payload: { id: budi.id } });
    expect(state.people.filter((p) => p.isHost)).toHaveLength(1);
    expect(state.people[1].isHost).toBe(true);
  });

  it('ADD_ITEM / UPDATE_ITEM / REMOVE_ITEM round-trip', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    const personId = state.people[0].id;
    state = act(state, {
      type: 'ADD_ITEM',
      payload: { name: 'Nasi', unitPrice: 1000, quantity: 1, assignments: [{ personId, qty: 1 }] },
    });
    const itemId = state.items[0].id;
    expect(state.items[0]).toMatchObject({ name: 'Nasi', unitPrice: 1000 });
    state = act(state, {
      type: 'UPDATE_ITEM',
      payload: { id: itemId, name: 'Nasi Goreng', unitPrice: 1500, quantity: 2, assignments: [{ personId, qty: 2 }] },
    });
    expect(state.items[0]).toMatchObject({ name: 'Nasi Goreng', unitPrice: 1500, quantity: 2 });
    state = act(state, { type: 'REMOVE_ITEM', payload: { id: itemId } });
    expect(state.items).toHaveLength(0);
  });

  it('SET_ASSIGNMENT_QTY sets, updates, and removes assignments', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Budi' } });
    const [andi, budi] = state.people;
    state = act(state, {
      type: 'ADD_ITEM',
      payload: { name: 'Nasi', unitPrice: 1000, quantity: 2, assignments: [] },
    });
    const itemId = state.items[0].id;
    state = act(state, {
      type: 'SET_ASSIGNMENT_QTY', payload: { itemId, personId: andi.id, qty: 1 },
    });
    expect(state.items[0].assignments).toEqual([{ personId: andi.id, qty: 1 }]);
    state = act(state, {
      type: 'SET_ASSIGNMENT_QTY', payload: { itemId, personId: budi.id, qty: 1 },
    });
    expect(state.items[0].assignments).toHaveLength(2);
    state = act(state, {
      type: 'SET_ASSIGNMENT_QTY', payload: { itemId, personId: andi.id, qty: 2 },
    });
    expect(state.items[0].assignments.find((a) => a.personId === andi.id)?.qty).toBe(2);
    state = act(state, {
      type: 'SET_ASSIGNMENT_QTY', payload: { itemId, personId: andi.id, qty: 0 },
    });
    expect(state.items[0].assignments.some((a) => a.personId === andi.id)).toBe(false);
  });

  it('ADD_DISCOUNT / REMOVE_DISCOUNT round-trip', () => {
    let state = base();
    state = act(state, { type: 'ADD_DISCOUNT', payload: { label: 'Promo', amount: 100 } });
    expect(state.discounts).toHaveLength(1);
    expect(state.discounts[0]).toMatchObject({ label: 'Promo', amount: 100 });
    state = act(state, { type: 'REMOVE_DISCOUNT', payload: { id: state.discounts[0].id } });
    expect(state.discounts).toHaveLength(0);
  });

  it('ADD_TAX / REMOVE_TAX round-trip', () => {
    let state = base();
    state = act(state, { type: 'ADD_TAX', payload: { label: 'PPN', amount: 110 } });
    expect(state.taxes).toHaveLength(1);
    expect(state.taxes[0]).toMatchObject({ label: 'PPN', amount: 110 });
    state = act(state, { type: 'REMOVE_TAX', payload: { id: state.taxes[0].id } });
    expect(state.taxes).toHaveLength(0);
  });

  it('ADD_FEE / REMOVE_FEE round-trip', () => {
    let state = base();
    state = act(state, { type: 'ADD_FEE', payload: { label: 'Service', amount: 5000 } });
    expect(state.fees).toHaveLength(1);
    expect(state.fees[0]).toMatchObject({ label: 'Service', amount: 5000 });
    state = act(state, { type: 'REMOVE_FEE', payload: { id: state.fees[0].id } });
    expect(state.fees).toHaveLength(0);
  });

  it('RESET returns an empty bill', () => {
    let state = base();
    state = act(state, { type: 'ADD_PERSON', payload: { name: 'Andi' } });
    state = act(state, { type: 'RESET' });
    expect(state).toEqual(emptyBill());
  });

  it('LOAD replaces state verbatim', () => {
    const fresh = base();
    const loaded = {
      people: [{ id: 'p1', name: 'Andi', isHost: true }],
      items: [],
      discounts: [],
      taxes: [],
      fees: [],
    };
    const next = act(fresh, { type: 'LOAD', payload: loaded });
    expect(next).toBe(loaded);
    expect(next.people).toHaveLength(1);
  });

  it('unknown action returns state unchanged', () => {
    const state = base();
    const next = billReducer(state, { type: 'NOT_A_REAL_ACTION' } as never);
    expect(next).toBe(state);
  });
});
