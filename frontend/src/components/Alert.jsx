import { useEffect, useState } from "react";
import { cn } from "../utils/cn.js";

export default function Alert({ type = "error", children, className, open = true, onClose, message }) {
  const [isOpen, setIsOpen] = useState(Boolean(open));
  const content = children ?? message;

  const styles =
    type === "success"
      ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
      : "border-rose-200/80 bg-rose-50/90 text-rose-800";

  useEffect(() => {
    setIsOpen(Boolean(open));
  }, [open, content, type]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen || content == null || content === "") return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-4 py-6 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className={cn(
          "slide-in-up relative w-full max-w-md rounded-2xl border px-5 py-4 text-sm font-medium shadow-lg",
          styles,
          className
        )}
        role="alert"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1 text-current transition hover:bg-black/5"
          aria-label="Đóng thông báo"
        >
          ×
        </button>
        {content}
      </div>
    </div>
  );
}
