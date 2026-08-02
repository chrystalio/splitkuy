'use client';

import { BillProvider } from './BillContext';
import { PeopleSection } from './PeopleSection';
import { ExtrasSection } from './ExtrasSection';
import { ItemList } from './ItemList';
import { SummaryPanel } from './SummaryPanel';
import { ThemeToggle } from './ThemeToggle';

export function BillApp() {
  return (
    <BillProvider>
      <ThemeToggle />
      <main className="mx-auto max-w-lg px-5 py-8">
        <h1 className="mb-1 text-[22px] font-bold text-slate-900 dark:text-slate-100">
          SplitKuy
        </h1>
        <p className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
          Split the caffeine, not the headache.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          A frictionless web app for team lunch and coffee runs with proportional tax math.
        </p>
        <p className="mb-8 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          No accounts, no sign-ups, no drama.
        </p>
        <PeopleSection />
        <ExtrasSection />
        <ItemList />
        <SummaryPanel />
      </main>
    </BillProvider>
  );
}
