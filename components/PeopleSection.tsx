// components/PeopleSection.tsx
'use client';

import { useState } from 'react';
import { useBill } from '@/hooks/useBill';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function PeopleSection() {
  const { bill, dispatch } = useBill();
  const [name, setName] = useState('');

  function addPerson() {
    if (!name.trim()) return;
    dispatch({ type: 'ADD_PERSON', payload: { name: name.trim() } });
    setName('');
  }

  function removePerson(id: string) {
    dispatch({ type: 'REMOVE_PERSON', payload: { id } });
  }

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          People ({bill.people.length})
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {bill.people.map((person) => (
          <div
            key={person.id}
            className={[
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
              person.isHost
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
            ].join(' ')}
          >
            {person.name}
            {person.isHost && (
              <span className="text-xs opacity-70">(host)</span>
            )}
            <button
              type="button"
              onClick={() => removePerson(person.id)}
              className="ml-1 text-slate-400 hover:text-slate-600"
              aria-label={`Remove ${person.name}`}
            >
              ×
            </button>
          </div>
        ))}

        {bill.people.length === 0 && (
          <p className="text-sm text-slate-400">No people yet</p>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <Input
          placeholder="Add person name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          className="flex-1"
        />
        <Button onClick={addPerson} disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </section>
  );
}
