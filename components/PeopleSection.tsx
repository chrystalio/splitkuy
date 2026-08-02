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
              className="ml-1 inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center text-slate-400 hover:text-slate-600"
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
