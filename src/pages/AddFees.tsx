import { useBillStore } from "@/store";
import { useState } from "react";
import { Plus, Trash2, Receipt } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { FeeType } from "@/types";

const FEE_TYPES: { type: FeeType; label: string; description: string; icon: string }[] = [
  { type: "flat_equal", label: "Equal", description: "Delivery, tax — split equally", icon: "=" },
  { type: "proportional", label: "Proportional", description: "Service charge — by what you ordered", icon: "%" },
  { type: "flat_discount", label: "Discount", description: "Coupon — saves everyone proportionally", icon: "−" },
];

export function AddFees() {
  const fees = useBillStore((s) => s.fees);
  const addFee = useBillStore((s) => s.addFee);
  const removeFee = useBillStore((s) => s.removeFee);
  const result = useBillStore((s) => s.result);
  const currency = useBillStore((s) => s.currency);
  const recompute = useBillStore((s) => s.recompute);

  const [selectedType, setSelectedType] = useState<FeeType>("flat_equal");
  const [feeName, setFeeName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");

  function handleAdd() {
    const amount = parseFloat(feeAmount);
    if (!feeName.trim() || isNaN(amount) || amount <= 0) return;

    addFee({
      id: crypto.randomUUID(),
      name: feeName.trim(),
      type: selectedType,
      amount,
    });
    setFeeName("");
    setFeeAmount("");
    recompute();
  }

  function handleRemove(id: string) {
    removeFee(id);
    recompute();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text">Any extras?</h2>
          <p className="text-sm text-text-muted">Delivery, tax, or discounts.</p>
        </div>
      </div>

      {/* Existing fees */}
      {fees.length > 0 && (
        <div className="rounded-xl border border-border bg-surface shadow-card">
          {fees.map((fee, idx) => {
            const typeInfo = FEE_TYPES.find((t) => t.type === fee.type);
            return (
              <div
                key={fee.id}
                className={cn(
                  "animate-slide-up flex items-center justify-between px-4 py-3 transition-colors hover:bg-bg/50",
                  idx > 0 && "border-t border-border",
                )}
                style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-light text-xs font-bold text-primary-dark">
                    {typeInfo?.icon}
                  </div>
                  <div>
                    <span className="font-medium text-text">{fee.name}</span>
                    <span className="ml-2 text-[11px] text-text-muted">{typeInfo?.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-secondary" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {fee.type === "proportional" ? `${fee.amount}%` : formatCurrency(fee.amount, currency)}
                  </span>
                  <button
                    onClick={() => handleRemove(fee.id)}
                    className="rounded-lg p-1.5 text-text-muted transition-all duration-150 hover:bg-red-50 hover:text-error active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fee type pills */}
      <div className="flex gap-2">
        {FEE_TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => setSelectedType(t.type)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200",
              selectedType === t.type
                ? "bg-primary text-white shadow-sm"
                : "bg-surface text-text-secondary shadow-card hover:bg-bg active:scale-[0.97]",
            )}
          >
            <span className="text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted">
        {FEE_TYPES.find((t) => t.type === selectedType)?.description}
      </p>

      {/* Add fee form */}
      <div className="flex gap-2">
        <input
          type="text"
          value={feeName}
          onChange={(e) => setFeeName(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Fee name"
        />
        <input
          type="number"
          value={feeAmount}
          onChange={(e) => setFeeAmount(e.target.value)}
          className="w-24 rounded-lg border border-border bg-surface px-4 py-3 text-right text-sm font-medium text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-muted [appearance:textfield] focus:border-primary focus:ring-2 focus:ring-primary/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder={selectedType === "proportional" ? "%" : "$"}
          min="0"
          step="0.01"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-primary px-4 py-3 text-white shadow-button transition-all duration-200 hover:bg-primary-dark hover:shadow-card-hover active:scale-[0.95]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Live preview */}
      {result && result.people.length > 0 && (
        <div className="animate-scale-in rounded-xl border border-border bg-bg p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Sneak peek
            </h3>
          </div>
          <div className="space-y-2">
            {result.people.map((p) => (
              <div key={p.personId} className="flex justify-between text-sm">
                <span className="text-text-secondary">{p.personName}</span>
                <span className="font-semibold text-text" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(p.total, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fees.length === 0 && !result && (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface px-4 py-8 text-center">
          <Receipt className="mx-auto mb-2 h-8 w-8 text-text-muted/50" />
          <p className="text-sm font-medium text-text-muted">No fees added</p>
          <p className="mt-0.5 text-xs text-text-muted">Skip this step if there are no extra charges.</p>
        </div>
      )}
    </div>
  );
}
