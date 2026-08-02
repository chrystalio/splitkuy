'use client';

import { useState, ReactNode } from 'react';

interface AccordionProps {
  title: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Accordion({
  title,
  summary,
  defaultOpen = false,
  children,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {summary && !open && (
            <span className="text-slate-500">{summary}</span>
          )}
          <span className="text-slate-400">{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">{children}</div>}
    </div>
  );
}
