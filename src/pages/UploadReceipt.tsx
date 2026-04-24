import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Camera, Keyboard, Loader2, ScanLine } from "lucide-react";
import { useBillStore } from "@/store";
import type { Fee, Discount } from "@/types";

/** Heuristic: guess split type from fee name */
function inferSplitType(name: string): "equal" | "proportional" {
  const lower = name.toLowerCase();
  // Percentage-based fees → proportional
  if (
    lower.includes("tax") ||
    lower.includes("vat") ||
    lower.includes("service") ||
    lower.includes("charge") ||
    lower.includes("percentage")
  ) {
    return "proportional";
  }
  // Flat fixed fees → equal
  return "equal";
}

export function UploadReceipt() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setItems = useBillStore((s) => s.setItems);
  const setFees = useBillStore((s) => s.setFees);
  const setDiscounts = useBillStore((s) => s.setDiscounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "x-api-key": import.meta.env.VITE_API_KEY ?? "" },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || `Request failed (${res.status})`);
      }

      const receipt = data.data ?? data;
      if (!Array.isArray(receipt.items)) {
        throw new Error("Unexpected response format from API");
      }

      // Map items
      const items = (receipt.items ?? []).map(
        (item: { name: string; price: number; quantity?: number }) => ({
          id: crypto.randomUUID(),
          name: item.name,
          price: item.price,
          quantity: item.quantity ?? 1,
        }),
      );
      setItems(items, receipt.currency);

      // Map fees from API to Fee model
      // splitType is inferred: proportional for tax/vat/service, equal for flat fees
      const fees: Fee[] = (receipt.fees ?? []).map(
        (fee: { name: string; amount: number; type?: string }, idx: number) => ({
          id: String(idx),
          name: fee.name,
          splitType: fee.type === "percentage" ? "proportional" : inferSplitType(fee.name),
          amount: fee.amount,
        }),
      );
      setFees(fees);

      // Map discounts from API directly
      const discounts: Discount[] = (receipt.discounts ?? []).map(
        (disc: { name: string; amount: number; type?: string; appliesTo?: string }, idx: number) => ({
          id: String(idx),
          name: disc.name,
          type: disc.type ?? "flat",
          appliesTo: disc.appliesTo ?? "subtotal",
          amount: disc.amount,
        }),
      );
      setDiscounts(discounts);

      navigate("/review");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't read that one. Enter items manually instead?";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleManualEntry() {
    setItems([]);
    setFees([]);
    setDiscounts([]);
    navigate("/review");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
            <ScanLine className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text">Got a receipt?</h2>
          <p className="mt-1 text-sm text-text-muted">Snap it or type it — we'll do the math.</p>
        </div>

        {error && (
          <div className="animate-scale-in rounded-lg border border-red-200 bg-error-light px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="animate-slide-up grid grid-cols-2 gap-3" style={{ animationDelay: "60ms" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-8 text-text-secondary transition-all duration-200 hover:border-primary hover:bg-primary/5 active:scale-[0.97]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-semibold">Take photo</span>
          </button>

          <button
            onClick={handleManualEntry}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-8 text-text-secondary transition-all duration-200 hover:border-primary hover:bg-primary/5 active:scale-[0.97]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
              <Keyboard className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-semibold">Type manually</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {loading && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-text-muted">Scanning receipt...</p>
          </div>
        )}

        <p className="text-center text-xs text-text-muted">
          Powered by Google Gemini
        </p>
      </div>
    </div>
  );
}
