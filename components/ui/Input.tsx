'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={[
          'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent',
          'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-slate-100',
          className,
        ].join(' ')}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
