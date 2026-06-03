export default function Modal({ open, onClose, title, subtitle, children, size = "md" }) {
  if (!open) return null;

  const sizeClass =
    size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-xl";

  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-blush-900/30 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={`scale-in glass-panel w-full ${sizeClass} rounded-3xl p-6 shadow-[0_40px_100px_rgba(200,120,150,0.22)]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {subtitle ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blush-500">
                {subtitle}
              </p>
            ) : null}
            <h2 id="modal-title" className="mt-1 text-2xl font-bold text-blush-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="btn-interactive flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xl text-blush-600 hover:bg-blush-200"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
