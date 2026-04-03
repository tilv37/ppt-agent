"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";

type ActiveNav = "projects" | "templates" | null;

interface ProductTopBarProps {
  activeNav?: ActiveNav;
  userLabel?: string | null;
  searchSlot?: ReactNode;
  actionLabel?: string;
  actionIcon?: string;
  actionHref?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  extraActions?: ReactNode;
  onLogout?: () => void;
}

const navItems: Array<{ key: Exclude<ActiveNav, null>; label: string; href: string }> = [
  { key: "projects", label: "Projects", href: "/" },
  { key: "templates", label: "Templates", href: "/templates" },
];

export function ProductTopBar({
  activeNav = null,
  userLabel,
  searchSlot,
  actionLabel,
  actionIcon,
  actionHref,
  onAction,
  actionDisabled,
  extraActions,
  onLogout,
}: ProductTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-3 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-slate-900 font-headline no-underline">
          CognitiveCanvas
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = activeNav === item.key || pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`font-medium transition-colors no-underline ${
                  isActive
                    ? "text-blue-600 font-bold border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-blue-500"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {searchSlot && <div className="hidden lg:block">{searchSlot}</div>}
        
        <button className="p-2 text-slate-500 hover:text-blue-500 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-slate-500 hover:text-blue-500 transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>

        {actionLabel && (actionHref || onAction) ? (
          actionHref ? (
            <Link
              href={actionHref}
              className="bg-gradient-to-br from-primary to-primary-container text-white px-4 py-2 rounded-full text-sm font-semibold transition-transform scale-95 active:scale-90 no-underline hidden md:flex items-center gap-2"
            >
              {actionIcon && <span className="material-symbols-outlined text-sm">{actionIcon}</span>}
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              disabled={actionDisabled}
              className="bg-gradient-to-br from-primary to-primary-container text-white px-4 py-2 rounded-full text-sm font-semibold transition-transform scale-95 active:scale-90 disabled:opacity-50 hidden md:flex items-center gap-2"
            >
              {actionIcon && <span className="material-symbols-outlined text-sm">{actionIcon}</span>}
              {actionLabel}
            </button>
          )
        ) : null}

        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-tertiary"></div>
      </div>
    </nav>
  );
}

export function ProductFooter() {
  return (
    <footer className="bg-slate-50 py-6 border-t border-slate-200/50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-8">
        <span className="text-xs tracking-wide text-slate-400">© 2024 CognitiveCanvas AI. All rights reserved.</span>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="text-xs text-slate-500 hover:underline" href="#">Support</a>
          <a className="text-xs text-slate-500 hover:underline" href="#">Privacy</a>
          <a className="text-xs text-slate-500 hover:underline" href="#">Terms</a>
          <a className="text-xs text-slate-500 hover:underline" href="#">Documentation</a>
        </div>
      </div>
    </footer>
  );
}