import { useBillStore } from "@/store";
import { useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

export function ReviewItems() {
  const items = useBillStore((s) => s.items);
  const currency = useBillStore((s) => s.currency);
  const addItem = useBillStore((s) => s.addItem);
  const removeItem = useBillStore((s) => s.removeItem);
  const updateItem = useBillStore((s) => s.updateItem);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("1");

  function handleAdd() {
    const price = parseFloat(newPrice);
    const qty = parseInt(newQty, 10);
    if (!newName.trim() || isNaN(price) || price <= 0 || isNaN(qty) || qty < 1) return;

    addItem({
      id: crypto.randomUUID(),
      name: newName.trim(),
      price,
      quantity: qty,
    });
    setNewName("");
    setNewPrice("");
    setNewQty("1");
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">What did you order?</h2>
            <p className="text-sm text-text-muted">Check the items. Add or remove as needed.</p>
          </div>
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface px-4 py-10 text-center">
          <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-text-muted/50" />
          <p className="text-sm font-medium text-text-muted">No items yet</p>
          <p className="mt-0.5 text-xs text-text-muted">Add what you ordered below.</p>
        </div>
      )}

      {/* Items table-style list */}
      {items.length > 0 && (
        <div className="rounded-xl border border-border bg-surface shadow-card">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "animate-slide-up flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg/50",
                idx > 0 && "border-t border-border",
              )}
              style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text outline-none placeholder:text-text-muted"
                placeholder="Item"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted">×</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value, 10) || 1 })}
                  className="w-8 bg-transparent text-center text-sm text-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  min="1"
                />
              </div>
              <input
                type="number"
                value={item.price}
                onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                className="w-24 bg-transparent text-right text-sm font-medium text-text outline-none [appearance:textfield] placeholder:text-text-muted [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="Price"
                min="0"
                step="0.01"
              />
              <button
                onClick={() => removeItem(item.id)}
                className="rounded-lg p-1.5 text-text-muted transition-all duration-150 hover:bg-red-50 hover:text-error active:scale-90"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add row */}
          <div className="flex items-center gap-3 border-t border-border bg-bg/60 px-4 py-3 transition-colors focus-within:bg-surface">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text outline-none placeholder:text-text-muted"
              placeholder="Add item..."
            />
            <input
              type="number"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="w-8 bg-transparent text-center text-sm text-text outline-none [appearance:textfield] placeholder:text-text-muted [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              min="1"
              placeholder="1"
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-24 bg-transparent text-right text-sm font-medium text-text outline-none [appearance:textfield] placeholder:text-text-muted [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="Price"
              min="0"
              step="0.01"
            />
            <button
              onClick={handleAdd}
              className="rounded-lg bg-primary p-2 text-white transition-all duration-150 hover:bg-primary-dark active:scale-90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary-light/50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-secondary">{items.length} item{items.length !== 1 ? "s" : ""}</span>
          <span className="text-sm font-bold text-primary-dark">
            {formatCurrency(
              items.reduce((sum, i) => sum + i.price * i.quantity, 0),
              currency,
            )}
          </span>
        </div>
      )}
    </div>
  );
}
