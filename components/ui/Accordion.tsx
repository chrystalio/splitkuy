'use client';

import { useId, useState, ReactNode } from 'react';

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
  const panelId = useId();

  return (
    <div className="rounded-[10px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {summary && !open && (
            <span className="text-slate-500">{summary}</span>
          )}
          <span className="text-slate-400">{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          className="border-t border-slate-100 px-3 py-2 dark:border-slate-800"
        >
          {children}
        </div>
      )}
    </div>
  );
}
