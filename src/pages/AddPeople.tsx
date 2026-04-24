import { useBillStore } from "@/store";
import { useState } from "react";
import { Plus, X, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const AVATAR_COLORS = [
  "#1cc29f",
  "#5b9bd5",
  "#e8a54b",
  "#e06c75",
  "#8e7cc3",
  "#56b6c2",
  "#d19a66",
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function AddPeople() {
  const people = useBillStore((s) => s.people);
  const addPerson = useBillStore((s) => s.addPerson);
  const removePerson = useBillStore((s) => s.removePerson);

  const [name, setName] = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    addPerson(name.trim());
    setName("");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text">Who's splitting?</h2>
          <p className="text-sm text-text-muted">Add everyone who's in on this bill.</p>
        </div>
      </div>

      {people.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface px-4 py-10 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-text-muted/50" />
          <p className="text-sm font-medium text-text-muted">Nobody here yet</p>
          <p className="mt-0.5 text-xs text-text-muted">Add at least two people.</p>
        </div>
      )}

      {people.length > 0 && (
        <div className="rounded-xl border border-border bg-surface shadow-card">
          {people.map((person, idx) => (
            <div
              key={person.id}
              className={cn(
                "animate-slide-up flex items-center justify-between px-4 py-3 transition-colors hover:bg-bg/50",
                idx > 0 && "border-t border-border",
              )}
              style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: getColor(person.name) }}
                >
                  {getInitials(person.name)}
                </div>
                <span className="font-medium text-text">{person.name}</span>
              </div>
              <button
                onClick={() => removePerson(person.id)}
                className="rounded-lg p-1.5 text-text-muted transition-all duration-150 hover:bg-red-50 hover:text-error active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Name"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-primary px-4 py-3 text-white shadow-button transition-all duration-200 hover:bg-primary-dark hover:shadow-card-hover active:scale-[0.95]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
