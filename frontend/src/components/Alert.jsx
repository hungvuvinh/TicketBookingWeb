import { cn } from "../utils/cn.js";

export default function Alert({ type = "error", children, className }) {
  const styles =
    type === "success"
      ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
      : "border-rose-200/80 bg-rose-50/90 text-rose-800";

  return (
    <div
      className={cn(
        "slide-in-up rounded-2xl border px-5 py-4 text-sm font-medium shadow-sm backdrop-blur-sm",
        styles,
        className
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
