import { Link } from "react-router-dom";

export default function Navbar({
  brand = "TicketBooking",
  tagline,
  children,
  sticky = true,
}) {
  return (
    <nav
      className={`slide-in-down border-b border-blush-100/80 bg-white/75 shadow-[0_8px_32px_rgba(235,150,180,0.08)] backdrop-blur-xl ${
        sticky ? "sticky top-0 z-40" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-400 to-blush-600 text-lg font-black text-white shadow-lg shadow-blush-300/40">
            T
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-blush-900">{brand}</p>
            {tagline ? <p className="text-xs text-blush-500">{tagline}</p> : null}
          </div>
        </Link>
        {children ? <div className="flex flex-wrap items-center gap-2 sm:gap-3">{children}</div> : null}
      </div>
    </nav>
  );
}
