import { useBillStore } from "@/store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Share2, RotateCcw, PartyPopper } from "lucide-react";
import { encodeShareUrl, decodeShareUrl } from "@/lib/share";
import { formatCurrency } from "@/lib/format";

export function Results() {
  const navigate = useNavigate();
  const items = useBillStore((s) => s.items);
  const people = useBillStore((s) => s.people);
  const assignments = useBillStore((s) => s.assignments);
  const fees = useBillStore((s) => s.fees);
  const currency = useBillStore((s) => s.currency);
  const result = useBillStore((s) => s.result);
  const recompute = useBillStore((s) => s.recompute);
  const loadFromShare = useBillStore((s) => s.loadFromShare);
  const reset = useBillStore((s) => s.reset);

  const [copied, setCopied] = useState<string | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const data = decodeShareUrl(hash);
      if (data) {
        loadFromShare(data);
        setIsSharedView(true);
        return;
      }
    }
    recompute();
  }, []);

  function getPersonItems(personId: string) {
    return assignments
      .filter((a) => a.personId === personId)
      .map((a) => {
        const item = items.find((i) => i.id === a.itemId);
        return item
          ? `${item.name} ×${item.quantity}`
          : "";
      })
      .filter(Boolean);
  }

  function copySummary() {
    if (!result) return;
    const lines = result.people.map(
      (p) => `${p.personName}: ${formatCurrency(p.total, currency)}`,
    );
    const text = `SplitKuy Summary\n${lines.join("\n")}\nTotal: ${formatCurrency(result.grandTotal, currency)}`;
    navigator.clipboard.writeText(text);
    setCopied("summary");
    setTimeout(() => setCopied(null), 2000);
  }

  function shareLink() {
    const encoded = encodeShareUrl({ items, people, assignments, fees, currency });
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    navigator.clipboard.writeText(url);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  }

  function handleNewSplit() {
    reset();
    window.history.replaceState(null, "", window.location.pathname);
    navigate("/");
  }

  if (!result || result.people.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-surface px-4 py-10 text-center">
        <PartyPopper className="mx-auto mb-2 h-8 w-8 text-text-muted/50" />
        <p className="text-sm font-medium text-text-muted">No results yet</p>
        <p className="mt-0.5 text-xs text-text-muted">Complete the wizard first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
          <PartyPopper className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text">Here's the damage</h2>
          <p className="text-sm text-text-muted">Share this before anyone "forgets."</p>
        </div>
      </div>

      {/* Person cards */}
      <div className="space-y-2.5">
        {result.people.map((person, idx) => (
          <div
            key={person.personId}
            className="animate-slide-up overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover"
            style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}
          >
            {/* Colored accent strip on left */}
            <div className="flex">
              <div className="w-1 bg-primary shrink-0" />
              <div className="flex-1 p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="font-bold text-text">{person.personName}</span>
                  <span
                    className="text-lg font-bold text-primary-dark"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCurrency(person.total, currency)}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  {getPersonItems(person.personId).map((desc, i) => (
                    <div key={i} className="flex items-start gap-2 text-text-secondary">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/30" />
                      <span>{desc}</span>
                    </div>
                  ))}
                  {person.equalFeeShare > 0 && (
                    <div className="flex items-center gap-2 text-text-muted">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                      + {formatCurrency(person.equalFeeShare, currency)} (equal fees)
                    </div>
                  )}
                  {person.proportionalFeeShare > 0 && (
                    <div className="flex items-center gap-2 text-text-muted">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                      + {formatCurrency(person.proportionalFeeShare, currency)} (proportional)
                    </div>
                  )}
                  {person.discountShare > 0 && (
                    <div className="flex items-center gap-2 text-primary-dark">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                      − {formatCurrency(person.discountShare, currency)} (discount)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grand total */}
      <div
        className="animate-slide-up overflow-hidden rounded-xl shadow-card"
        style={{ animationDelay: `${result.people.length * 80}ms`, animationFillMode: "both" }}
      >
        <div className="bg-text p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/60">Total bill</span>
            <span
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrency(result.grandTotal, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={copySummary}
          className="shadow-card flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3.5 text-sm font-semibold text-text-secondary transition-all duration-200 hover:shadow-card-hover hover:bg-bg active:scale-[0.98]"
        >
          <Copy className="h-4 w-4" />
          {copied === "summary" ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={shareLink}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-primary-dark hover:shadow-card-hover active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4" />
          {copied === "link" ? "Copied!" : "Share"}
        </button>
      </div>

      {isSharedView && (
        <button
          onClick={handleNewSplit}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3.5 text-sm font-semibold text-text-secondary shadow-card transition-all duration-200 hover:shadow-card-hover hover:bg-bg active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Split another bill
        </button>
      )}
    </div>
  );
}
