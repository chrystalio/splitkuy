import { useBillStore } from "@/store";
import { useState } from "react";
import { Plus, Trash2, Receipt, Percent, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { Fee, Discount, SplitType } from "@/types";

const SPLIT_TYPES: { type: SplitType; label: string; description: string }[] = [
  {
    type: "equal",
    label: "Equal split",
    description: "Delivery fee, order fee — split equally among everyone regardless of what they ordered",
  },
  {
    type: "proportional",
    label: "Proportional",
    description: "VAT, service charge — split by what each person ordered",
  },
];

export function AddFees() {
  const fees = useBillStore((s) => s.fees);
  const discounts = useBillStore((s) => s.discounts);
  const addFee = useBillStore((s) => s.addFee);
  const removeFee = useBillStore((s) => s.removeFee);
  const updateFee = useBillStore((s) => s.updateFee);
  const addDiscount = useBillStore((s) => s.addDiscount);
  const removeDiscount = useBillStore((s) => s.removeDiscount);
  const updateDiscount = useBillStore((s) => s.updateDiscount);
  const result = useBillStore((s) => s.result);
  const currency = useBillStore((s) => s.currency);
  const recompute = useBillStore((s) => s.recompute);

  // Fee form state
  const [feeName, setFeeName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeSplitType, setFeeSplitType] = useState<SplitType>("equal");

  // Discount form state
  const [discName, setDiscName] = useState("");
  const [discAmount, setDiscAmount] = useState("");
  const [discAppliesTo, setDiscAppliesTo] = useState<"delivery" | "subtotal">("subtotal");

  // Tab: "fees" or "discounts"
  const [tab, setTab] = useState<"fees" | "discounts">("fees");

  function handleAddFee() {
    const amount = parseFloat(feeAmount);
    if (!feeName.trim() || isNaN(amount) || amount <= 0) return;
    addFee({ id: crypto.randomUUID(), name: feeName.trim(), splitType: feeSplitType, amount });
    setFeeName("");
    setFeeAmount("");
    recompute();
  }

  function handleRemoveFee(id: string) {
    removeFee(id);
    recompute();
  }

  function handleToggleSplitType(fee: Fee) {
    updateFee(fee.id, {
      splitType: fee.splitType === "equal" ? "proportional" : "equal",
    });
    recompute();
  }

  function handleAddDiscount() {
    const amount = parseFloat(discAmount);
    if (!discName.trim() || isNaN(amount) || amount <= 0) return;
    addDiscount({
      id: crypto.randomUUID(),
      name: discName.trim(),
      type: "flat",
      appliesTo: discAppliesTo,
      amount,
    });
    setDiscName("");
    setDiscAmount("");
    recompute();
  }

  function handleRemoveDiscount(id: string) {
    removeDiscount(id);
    recompute();
  }

  function handleToggleAppliesTo(disc: Discount) {
    updateDiscount(disc.id, {
      appliesTo: disc.appliesTo === "delivery" ? "subtotal" : "delivery",
    });
    recompute();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text">Fees &amp; discounts</h2>
          <p className="text-sm text-text-muted">From the receipt — you can edit or remove.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface p-1 shadow-card">
        <button
          onClick={() => setTab("fees")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200",
            tab === "fees" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"
          )}
        >
          Fees ({fees.length})
        </button>
        <button
          onClick={() => setTab("discounts")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200",
            tab === "discounts" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"
          )}
        >
          Discounts ({discounts.length})
        </button>
      </div>

      {/* FEES TAB */}
      {tab === "fees" && (
        <>
          {/* Fee list */}
          {fees.length > 0 && (
            <div className="rounded-xl border border-border bg-surface shadow-card">
              {fees.map((fee, idx) => (
                <div
                  key={fee.id}
                  className={cn(
                    "animate-slide-up flex items-center justify-between px-4 py-3 transition-colors hover:bg-bg/50",
                    idx > 0 && "border-t border-border"
                  )}
                  style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-3">
                    {/* Split type badge */}
                    <button
                      onClick={() => handleToggleSplitType(fee)}
                      title={fee.splitType === "equal" ? "Equal split" : "Proportional split"}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-80",
                        fee.splitType === "equal"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      )}
                    >
                      {fee.splitType === "equal" ? "=" : <Percent className="h-3 w-3" />}
                      {fee.splitType === "equal" ? "Equal" : "Prop."}
                    </button>
                    <div>
                      <span className="font-medium text-text">{fee.name}</span>
                      <span className="ml-2 text-[11px] text-text-muted">
                        {fee.splitType === "equal" ? "split equally" : "by subtotal share"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-secondary" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(fee.amount, currency)}
                    </span>
                    <button
                      onClick={() => handleRemoveFee(fee.id)}
                      className="rounded-lg p-1.5 text-text-muted transition-all duration-150 hover:bg-red-50 hover:text-error active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Split type selector */}
          <div className="flex gap-2">
            {SPLIT_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => setFeeSplitType(t.type)}
                className={cn(
                  "flex-1 rounded-xl border-2 px-3 py-2.5 text-left text-xs font-semibold transition-all duration-200",
                  feeSplitType === t.type
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-surface text-text-secondary hover:border-primary/40"
                )}
              >
                <div className="mb-0.5 font-bold">{t.label}</div>
                <div className="font-normal opacity-70">{t.description}</div>
              </button>
            ))}
          </div>

          {/* Add fee form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={feeName}
              onChange={(e) => setFeeName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Fee name (e.g. Delivery fee)"
            />
            <input
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="w-28 rounded-lg border border-border bg-surface px-4 py-3 text-right text-sm font-medium text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-muted [appearance:textfield] focus:border-primary focus:ring-2 focus:ring-primary/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="Amount"
              min="0"
              step="0.01"
            />
            <button
              onClick={handleAddFee}
              className="rounded-lg bg-primary px-4 py-3 text-white shadow-button transition-all duration-200 hover:bg-primary-dark hover:shadow-card-hover active:scale-[0.95]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* DISCOUNTS TAB */}
      {tab === "discounts" && (
        <>
          {discounts.length > 0 && (
            <div className="rounded-xl border border-border bg-surface shadow-card">
              {discounts.map((disc, idx) => (
                <div
                  key={disc.id}
                  className={cn(
                    "animate-slide-up flex items-center justify-between px-4 py-3 transition-colors hover:bg-bg/50",
                    idx > 0 && "border-t border-border"
                  )}
                  style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-3">
                    {/* Applies-to badge */}
                    <button
                      onClick={() => handleToggleAppliesTo(disc)}
                      title={disc.appliesTo === "delivery" ? "Offsets delivery fees equally" : "Offsets subtotal proportionally"}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-80",
                        disc.appliesTo === "delivery"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      )}
                    >
                      <Minus className="h-3 w-3" />
                      {disc.appliesTo === "delivery" ? "Delivery" : "Subtotal"}
                    </button>
                    <div>
                      <span className="font-medium text-text">{disc.name}</span>
                      <span className="ml-2 text-[11px] text-text-muted">
                        {disc.appliesTo === "delivery" ? "reduces equal-split fees" : "reduces proportional fees"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-green-600" style={{ fontVariantNumeric: "tabular-nums" }}>
                      -{formatCurrency(disc.amount, currency)}
                    </span>
                    <button
                      onClick={() => handleRemoveDiscount(disc.id)}
                      className="rounded-lg p-1.5 text-text-muted transition-all duration-150 hover:bg-red-50 hover:text-error active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Applies-to selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setDiscAppliesTo("delivery")}
              className={cn(
                "flex-1 rounded-xl border-2 px-3 py-2.5 text-left text-xs font-semibold transition-all duration-200",
                discAppliesTo === "delivery"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-border bg-surface text-text-secondary hover:border-green-300"
              )}
            >
              <div className="mb-0.5 font-bold">Delivery discount</div>
              <div className="font-normal opacity-70">Reduces equal-split fees equally (e.g. Ongkir promo)</div>
            </button>
            <button
              onClick={() => setDiscAppliesTo("subtotal")}
              className={cn(
                "flex-1 rounded-xl border-2 px-3 py-2.5 text-left text-xs font-semibold transition-all duration-200",
                discAppliesTo === "subtotal"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-border bg-surface text-text-secondary hover:border-orange-300"
              )}
            >
              <div className="mb-0.5 font-bold">Subtotal discount</div>
              <div className="font-normal opacity-70">Reduces proportional fees by share (e.g. Discount 20%)</div>
            </button>
          </div>

          {/* Add discount form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={discName}
              onChange={(e) => setDiscName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Discount name (e.g. Discount 20%)"
            />
            <input
              type="number"
              value={discAmount}
              onChange={(e) => setDiscAmount(e.target.value)}
              className="w-28 rounded-lg border border-border bg-surface px-4 py-3 text-right text-sm font-medium text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-muted [appearance:textfield] focus:border-primary focus:ring-2 focus:ring-primary/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="Amount"
              min="0"
              step="0.01"
            />
            <button
              onClick={handleAddDiscount}
              className="rounded-lg bg-green-600 px-4 py-3 text-white shadow-button transition-all duration-200 hover:bg-green-700 hover:shadow-card-hover active:scale-[0.95]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

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

      {fees.length === 0 && discounts.length === 0 && !result && (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface px-4 py-8 text-center">
          <Receipt className="mx-auto mb-2 h-8 w-8 text-text-muted/50" />
          <p className="text-sm font-medium text-text-muted">No fees or discounts added</p>
          <p className="mt-0.5 text-xs text-text-muted">Skip this step if there are no extra charges.</p>
        </div>
      )}
    </div>
  );
};
