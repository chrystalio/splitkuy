import { useNavigate } from "react-router-dom";
import { Receipt, Coffee } from "lucide-react";

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Logo mark with bounce-in */}
        <div
          className="relative animate-scale-in"
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary transition-transform duration-300 hover:scale-105"
            style={{ boxShadow: "0 12px 32px -6px rgb(28 194 159 / 0.35)" }}
          >
            <Receipt className="h-10 w-10 text-white" strokeWidth={1.8} />
          </div>
          {/* Tiny coffee icon badge */}
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface shadow-card">
            <Coffee className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
        </div>

        <div className="animate-slide-up">
          <h1 className="text-5xl font-bold tracking-tight text-text">SplitKuy</h1>
          <p className="mt-3 text-lg text-text-secondary">Your receipt, their problem.</p>
          <p className="mt-1 text-sm text-text-muted">No more "berapa tadi?"</p>
        </div>

        <button
          onClick={() => navigate("/upload")}
          className="animate-slide-up mt-2 w-full max-w-xs rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-button transition-all duration-200 hover:bg-primary-dark hover:shadow-card-hover active:scale-[0.97]"
          style={{ animationDelay: "0.12s", animationFillMode: "both" }}
        >
          Split a bill
        </button>

        <p className="animate-fade-in text-xs text-text-muted" style={{ animationDelay: "0.35s", animationFillMode: "both" }}>
          No sign-up required
        </p>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
        <p className="text-[11px] leading-relaxed text-text-muted">
          Made by <span className="font-semibold text-text-secondary">Chrystalio</span> who refused to do morning coffee math one more time.
          <br />
          No data stored. No account needed. Just split the bill and shut up.
        </p>
      </footer>
    </div>
  );
}
