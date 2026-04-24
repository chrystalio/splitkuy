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
  const discounts = useBillStore((s) => s.discounts);
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
        return item ? `${item.name} ×${item.quantity}` : "";
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
    const encoded = encodeShareUrl({ items, people, assignments, fees, discounts, currency });
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
      <div className="rounded-xl border-2 border-dashed border-border bg-surface px-4 py-12 text-center">
        <PartyPopper className="mx-auto mb-3 h-10 w-10 text-text-muted/50" />
        <p className="font-semibold text-text">No results yet</p>
        <p className="mt-1 text-sm text-text-muted">Assign items to people to see the split.</p>
        <button
          onClick={() => navigate("/assign")}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Go to Assign
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <PartyPopper className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text">All done!</h2>
        <p className="mt-1 text-sm text-text-muted">
          {result.people.length} people — {formatCurrency(result.grandTotal, currency)} total
        </p>
      </div>

      {/* Person breakdown */}
      <div className="space-y-3">
        {result.people.map((p) => (
          <div
            key={p.personId}
            className="rounded-xl border border-border bg-surface px-4 py-3 shadow-card"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-text">{p.personName}</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(p.total, currency)}
              </span>
            </div>
            <div className="space-y-1">
              {getPersonItems(p.personId).map((itemStr, idx) => (
                <div key={idx} className="flex justify-between text-sm text-text-secondary">
                  <span>{itemStr}</span>
                </div>
              ))}
            </div>
            {(p.equalShare !== 0 || p.proportionalShare !== 0) && (
              <div className="mt-2 border-t border-border pt-2 space-y-0.5">
                {p.equalShare !== 0 && (
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Equal share</span>
                    <span>{formatCurrency(p.equalShare, currency)}</span>
                  </div>
                )}
                {p.proportionalShare !== 0 && (
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Proportional share</span>
                    <span>{formatCurrency(p.proportionalShare, currency)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {result.remainder !== 0 && (
        <p className="text-center text-xs text-text-muted">
          Rounding: {formatCurrency(Math.abs(result.remainder), currency)} {result.remainder > 0 ? "added to" : "deducted from"} first person.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={copySummary}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface py-3 text-sm font-semibold text-text shadow-card transition-all hover:bg-bg active:scale-[0.97]"
        >
          <Copy className="h-4 w-4" />
          {copied === "summary" ? "Copied!" : "Copy text"}
        </button>
        <button
          onClick={shareLink}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface py-3 text-sm font-semibold text-text shadow-card transition-all hover:bg-bg active:scale-[0.97]"
        >
          <Share2 className="h-4 w-4" />
          {copied === "link" ? "Link copied!" : "Share link"}
        </button>
      </div>

      {isSharedView && (
        <button
          onClick={handleNewSplit}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-text-secondary shadow-card transition-all hover:bg-bg active:scale-[0.97]"
        >
          <RotateCcw className="h-4 w-4" />
          Start new split
        </button>
      )}
    </div>
  );
};
