import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Camera, Keyboard, Loader2, ScanLine } from "lucide-react";
import { useBillStore } from "@/store";

export function UploadReceipt() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setItems = useBillStore((s) => s.setItems);
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
      const items = (receipt.items ?? []).map(
        (item: { name: string; price: number; quantity?: number }, idx: number) => ({
          id: String(idx),
          name: item.name,
          price: item.price,
          quantity: item.quantity ?? 1,
        }),
      );
      setItems(items, receipt.currency);
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
          <div className="animate-scale-in rounded-lg border border-red-200 bg-error-light px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="animate-slide-up group shadow-card flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface px-6 py-10 transition-all duration-200 hover:shadow-card-hover hover:border-primary/30 active:scale-[0.99] disabled:opacity-50"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          {loading ? (
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light transition-transform duration-200 group-hover:scale-110 group-hover:shadow-sm">
              <Camera className="h-7 w-7 text-primary" />
            </div>
          )}
          <div>
            <span className="block text-base font-semibold text-text">
              {loading ? "Reading receipt..." : "Snap a receipt"}
            </span>
            {!loading && (
              <span className="mt-0.5 block text-xs text-text-muted">Photo or gallery</span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-3 text-text-muted animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={handleManualEntry}
          disabled={loading}
          className="animate-slide-up shadow-card flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-4 font-semibold text-text-secondary transition-all duration-200 hover:shadow-card-hover hover:border-primary/20 active:scale-[0.99] disabled:opacity-50"
          style={{ animationDelay: "0.25s", animationFillMode: "both" }}
        >
          <Keyboard className="h-5 w-5" />
          Type it out
        </button>
      </div>
    </div>
  );
}
