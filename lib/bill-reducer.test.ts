// lib/bill-reducer.test.ts
import { describe, it, expect } from 'vitest';
import { billReducer, emptyBill } from './bill-reducer';
import type { Bill } from './types';

describe('billReducer', () => {
  describe('ADD_PERSON', () => {
    it('adds the first person and marks them as host', () => {
      const state = billReducer(emptyBill(), {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      expect(state.people).toHaveLength(1);
      expect(state.people[0].name).toBe('Andi');
      expect(state.people[0].isHost).toBe(true);
    });

    it('adds subsequent people without the host flag', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Budi' },
      });
      expect(state.people).toHaveLength(2);
      expect(state.people[0].isHost).toBe(true);
      expect(state.people[1].isHost).toBe(false);
    });

    it('generates a non-empty id for each person', () => {
      const state = billReducer(emptyBill(), {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      expect(typeof state.people[0].id).toBe('string');
      expect(state.people[0].id.length).toBeGreaterThan(0);
    });
  });

  describe('REMOVE_PERSON', () => {
    it('removes the named person', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Budi' },
      });
      const removed = billReducer(state, {
        type: 'REMOVE_PERSON',
        payload: { id: state.people[1].id },
      });
      expect(removed.people).toHaveLength(1);
      expect(removed.people[0].name).toBe('Andi');
    });

    it('promotes the next person to host when the host is removed', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Budi' },
      });
      const removed = billReducer(state, {
        type: 'REMOVE_PERSON',
        payload: { id: state.people[0].id },
      });
      expect(removed.people).toHaveLength(1);
      expect(removed.people[0].isHost).toBe(true);
      expect(removed.people[0].name).toBe('Budi');
    });

    it('strips assignments for the removed person', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Budi' },
      });
      const personId = state.people[0].id;
      const otherId = state.people[1].id;
      state = billReducer(state, {
        type: 'ADD_ITEM',
        payload: {
          name: 'Nasi',
          unitPrice: 10000,
          quantity: 2,
          assignments: [
            { personId, qty: 1 },
            { personId: otherId, qty: 1 },
          ],
        },
      });
      const removed = billReducer(state, {
        type: 'REMOVE_PERSON',
        payload: { id: otherId },
      });
      expect(removed.items[0].assignments).toHaveLength(1);
      expect(removed.items[0].assignments[0].personId).toBe(personId);
    });
  });

  describe('SET_HOST', () => {
    it('moves the host flag to the named person', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Budi' },
      });
      const updated = billReducer(state, {
        type: 'SET_HOST',
        payload: { id: state.people[1].id },
      });
      expect(updated.people[0].isHost).toBe(false);
      expect(updated.people[1].isHost).toBe(true);
    });
  });

  describe('items', () => {
    it('adds, updates, and removes items', () => {
      let state = billReducer(emptyBill(), {
        type: 'ADD_ITEM',
        payload: {
          name: 'Nasi',
          unitPrice: 10000,
          quantity: 1,
          assignments: [],
        },
      });
      expect(state.items).toHaveLength(1);

      state = billReducer(state, {
        type: 'UPDATE_ITEM',
        payload: { ...state.items[0], name: 'Nasi Goreng' },
      });
      expect(state.items[0].name).toBe('Nasi Goreng');

      state = billReducer(state, {
        type: 'REMOVE_ITEM',
        payload: { id: state.items[0].id },
      });
      expect(state.items).toHaveLength(0);
    });

    it('SET_ASSIGNMENT_QTY upserts an assignment when qty > 0', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      state = billReducer(state, {
        type: 'ADD_ITEM',
        payload: {
          name: 'Nasi',
          unitPrice: 10000,
          quantity: 2,
          assignments: [],
        },
      });
      state = billReducer(state, {
        type: 'SET_ASSIGNMENT_QTY',
        payload: {
          itemId: state.items[0].id,
          personId: state.people[0].id,
          qty: 2,
        },
      });
      expect(state.items[0].assignments).toEqual([
        { personId: state.people[0].id, qty: 2 },
      ]);
    });

    it('SET_ASSIGNMENT_QTY removes the assignment when qty === 0', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      state = billReducer(state, {
        type: 'ADD_ITEM',
        payload: {
          name: 'Nasi',
          unitPrice: 10000,
          quantity: 1,
          assignments: [{ personId: state.people[0].id, qty: 1 }],
        },
      });
      state = billReducer(state, {
        type: 'SET_ASSIGNMENT_QTY',
        payload: {
          itemId: state.items[0].id,
          personId: state.people[0].id,
          qty: 0,
        },
      });
      expect(state.items[0].assignments).toEqual([]);
    });
  });

  describe('extras', () => {
    it('adds and removes discounts, taxes, and fees', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_DISCOUNT',
        payload: { label: 'Promo', amount: 1000 },
      });
      state = billReducer(state, {
        type: 'ADD_TAX',
        payload: { label: 'PPN', amount: 1100 },
      });
      state = billReducer(state, {
        type: 'ADD_FEE',
        payload: { label: 'Service', amount: 3000 },
      });
      expect(state.discounts).toHaveLength(1);
      expect(state.taxes).toHaveLength(1);
      expect(state.fees).toHaveLength(1);

      state = billReducer(state, {
        type: 'REMOVE_DISCOUNT',
        payload: { id: state.discounts[0].id },
      });
      state = billReducer(state, {
        type: 'REMOVE_TAX',
        payload: { id: state.taxes[0].id },
      });
      state = billReducer(state, {
        type: 'REMOVE_FEE',
        payload: { id: state.fees[0].id },
      });
      expect(state.discounts).toHaveLength(0);
      expect(state.taxes).toHaveLength(0);
      expect(state.fees).toHaveLength(0);
    });
  });

  describe('LOAD and RESET', () => {
    it('LOAD replaces state with the payload', () => {
      const loaded: Bill = {
        people: [{ id: 'p1', name: 'Andi', isHost: true }],
        items: [],
        discounts: [],
        taxes: [],
        fees: [],
      };
      const state = billReducer(emptyBill(), { type: 'LOAD', payload: loaded });
      expect(state).toEqual(loaded);
    });

    it('RESET returns an empty bill', () => {
      let state = emptyBill();
      state = billReducer(state, {
        type: 'ADD_PERSON',
        payload: { name: 'Andi' },
      });
      state = billReducer(state, { type: 'RESET' });
      expect(state.people).toHaveLength(0);
    });
  });

  describe('genId fallback', () => {
    it('uses a non-UUID id when crypto.randomUUID is unavailable', async () => {
      const { genId } = await import('./utils');
      const realCrypto = (globalThis as { crypto?: Crypto }).crypto;
      try {
        // Simulate older Android WebView: no crypto.randomUUID.
        Object.defineProperty(globalThis, 'crypto', {
          value: {},
          configurable: true,
        });
        const id = genId();
        expect(id).toMatch(/^[a-z0-9-]+$/);
        expect(id.length).toBeGreaterThan(8);
        // Should NOT be a UUID format (would mean the fallback didn't run).
        expect(id).not.toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
      } finally {
        if (realCrypto !== undefined) {
          Object.defineProperty(globalThis, 'crypto', {
            value: realCrypto,
            configurable: true,
          });
        }
      }
    });

    it('uses crypto.randomUUID when available', async () => {
      const { genId } = await import('./utils');
      const id = genId();
      // Modern environment should produce a UUID.
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });
});
