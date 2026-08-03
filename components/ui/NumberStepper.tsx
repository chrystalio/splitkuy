'use client';

import { Button } from './button';

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
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!canDecrement}
        onClick={() => canDecrement && onChange(value - 1)}
        aria-label="Decrease"
        className="h-7 w-7 p-0"
      >
        −
      </Button>
      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!canIncrement}
        onClick={() => canIncrement && onChange(value + 1)}
        aria-label="Increase"
        className="h-7 w-7 p-0"
      >
        +
      </Button>
    </div>
  );
}
