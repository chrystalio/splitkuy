// components/PeopleSection.tsx
'use client';

import { useState } from 'react';
import { useBill } from '@/hooks/useBill';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function PeopleSection() {
  const { bill, dispatch } = useBill();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addPerson() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (bill.people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already added`);
      return;
    }
    dispatch({ type: 'ADD_PERSON', payload: { name: trimmed } });
    setName('');
    setError(null);
  }

  function removePerson(id: string) {
    dispatch({ type: 'REMOVE_PERSON', payload: { id } });
  }

  return (
    <section className="mb-4">
      <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        People
      </h2>

      <div className="flex flex-wrap gap-2">
        {bill.people.map((person) => (
          <div
            key={person.id}
            className="inline-flex h-7 items-center rounded-md bg-slate-100 pl-2.5 pr-1 gap-1 text-sm font-medium text-slate-900 dark:bg-slate-700 dark:text-slate-100"
          >
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_HOST', payload: { id: person.id } })}
              className="inline-flex items-center gap-1 text-left hover:opacity-80"
              aria-label={`Set ${person.name} as host`}
            >
              {person.name}
              {person.isHost && (
                <span
                  className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600 dark:bg-green-400 align-baseline"
                  aria-label="host"
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => removePerson(person.id)}
              className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center text-slate-400 hover:text-red-500"
              aria-label={`Remove ${person.name}`}
            >
              ×
            </button>
          </div>
        ))}

        {bill.people.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">No people yet</p>
        )}
      </div>

      {bill.people.length > 0 && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          tap a name to set as host
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <Input
          placeholder="Add person name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          aria-invalid={!!error}
          aria-describedby={error ? 'add-person-error' : undefined}
          className="flex-1"
        />
        <Button onClick={addPerson} disabled={!name.trim()}>
          Add
        </Button>
      </div>
      {error && (
        <p id="add-person-error" role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
