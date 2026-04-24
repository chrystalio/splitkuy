import { useNavigate, useLocation, Outlet } from "react-router-dom";

const STEPS = [
  { path: "/review", label: "Items" },
  { path: "/people", label: "People" },
  { path: "/assign", label: "Assign" },
  { path: "/fees", label: "Fees" },
  { path: "/results", label: "Results" },
];

export function WizardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIdx = STEPS.findIndex((s) => location.pathname.startsWith(s.path));
  const canGoBack = currentIdx > 0;
  const canGoNext = currentIdx < STEPS.length - 1;
  const progress = ((currentIdx + 1) / STEPS.length) * 100;

  function goBack() {
    if (canGoBack) navigate(STEPS[currentIdx - 1].path);
  }

  function goNext() {
    if (canGoNext) navigate(STEPS[currentIdx + 1].path);
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      {/* Progress bar */}
      <header className="sticky top-0 z-30 bg-surface/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-lg lg:max-w-xl">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-text">{STEPS[currentIdx].label}</span>
            <span className="text-xs font-medium text-text-muted">Step {currentIdx + 1} of {STEPS.length}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content with page transition */}
      <main className="flex-1 px-4 py-6">
        <div className="animate-fade-in mx-auto max-w-lg lg:max-w-xl" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      {/* Navigation */}
      <footer className="sticky bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-3 lg:max-w-xl">
          {canGoBack && (
            <button
              onClick={goBack}
              className="flex-1 rounded-lg border border-border bg-surface py-3 text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-bg hover:border-border active:scale-[0.98]"
            >
              Back
            </button>
          )}
          {canGoNext && (
            <button
              onClick={goNext}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-button transition-all duration-200 hover:bg-primary-dark hover:shadow-card-hover active:scale-[0.98]"
            >
              Next
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
