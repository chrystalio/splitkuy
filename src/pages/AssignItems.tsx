import { useBillStore } from "@/store";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { useState } from "react";
import { Check, ListChecks } from "lucide-react";

export function AssignItems() {
  const items = useBillStore((s) => s.items);
  const people = useBillStore((s) => s.people);
  const currency = useBillStore((s) => s.currency);
  const assignments = useBillStore((s) => s.assignments);
  const toggleAssignment = useBillStore((s) => s.toggleAssignment);

  const [selectedPerson, setSelectedPerson] = useState(people[0]?.id ?? "");

  const assignedCount = assignments.length;
  const totalItems = items.length;
  const allAssigned = assignedCount === totalItems;

  function getItemAssignedPerson(itemId: string): string | null {
    return assignments.find((a) => a.itemId === itemId)?.personId ?? null;
  }

  function handleToggle(itemId: string) {
    toggleAssignment(itemId, selectedPerson);
  }

  if (people.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-surface px-4 py-10 text-center">
        <ListChecks className="mx-auto mb-2 h-8 w-8 text-text-muted/50" />
        <p className="text-sm font-medium text-text-muted">Add some people first</p>
        <p className="mt-0.5 text-xs text-text-muted">Then come back to assign items.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">Who gets what?</h2>
            <p className="text-sm text-text-muted">Tap items to assign them.</p>
          </div>
        </div>
        <div
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            allAssigned ? "bg-primary-light text-primary-dark" : "bg-border text-text-muted",
          )}
        >
          {assignedCount}/{totalItems}
        </div>
      </div>

      {/* Person tabs */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
        {people.map((person) => {
          const count = assignments.filter((a) => a.personId === person.id).length;
          return (
            <button
              key={person.id}
              onClick={() => setSelectedPerson(person.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                selectedPerson === person.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-text-secondary shadow-card hover:bg-bg active:scale-[0.97]",
              )}
            >
              {person.name}
              {count > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-bold",
                    selectedPerson === person.id
                      ? "bg-white/25 text-white"
                      : "bg-bg text-text-muted",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items checklist */}
      <div className="rounded-xl border border-border bg-surface shadow-card">
        {items.map((item, idx) => {
          const assignedTo = getItemAssignedPerson(item.id);
          const isMine = assignedTo === selectedPerson;

          return (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={cn(
                "animate-slide-up flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150",
                idx > 0 && "border-t border-border",
                isMine
                  ? "bg-primary-light/60"
                  : "hover:bg-bg/50 active:scale-[0.99]",
              )}
              style={{ animationDelay: `${idx * 25}ms`, animationFillMode: "both" }}
            >
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-150",
                  isMine
                    ? "border-primary bg-primary text-white scale-110"
                    : "border-border hover:border-primary/40",
                )}
              >
                {isMine && <Check className="h-3 w-3" strokeWidth={3} />}
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text">{item.name}</span>
                {assignedTo && !isMine && (
                  <span className="block text-[11px] text-text-muted">
                    → {people.find((p) => p.id === assignedTo)?.name}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-sm font-medium text-text-secondary" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(item.price * item.quantity, currency)}
              </span>
            </button>
          );
        })}
      </div>

      {allAssigned && (
        <div className="animate-scale-in rounded-lg bg-primary-light px-4 py-2.5 text-center text-sm font-medium text-primary-dark">
          All items assigned
        </div>
      )}
    </div>
  );
}
