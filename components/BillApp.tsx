'use client';

import { BillProvider } from './BillContext';
import { PeopleSection } from './PeopleSection';
import { ExtrasSection } from './ExtrasSection';
import { ItemList } from './ItemList';
import { SummaryPanel } from './SummaryPanel';

export function BillApp() {
  return (
    <BillProvider>
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
          SplitKuy 🍽️
        </h1>
        <PeopleSection />
        <ExtrasSection />
        <ItemList />
        <SummaryPanel />
      </main>
    </BillProvider>
  );
}
