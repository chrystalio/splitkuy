'use client';

import { Button } from './Button';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
}: NumberStepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = max === undefined || value < max;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={!canDecrement}
        onClick={() => canDecrement && onChange(value - 1)}
        className={[
          'flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium',
          canDecrement
            ? 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            : 'border-slate-100 text-slate-300 cursor-not-allowed dark:border-slate-800',
        ].join(' ')}
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        disabled={!canIncrement}
        onClick={() => canIncrement && onChange(value + 1)}
        className={[
          'flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium',
          canIncrement
            ? 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            : 'border-slate-100 text-slate-300 cursor-not-allowed dark:border-slate-800',
        ].join(' ')}
      >
        +
      </button>
    </div>
  );
}
