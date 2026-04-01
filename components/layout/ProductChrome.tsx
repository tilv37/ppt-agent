"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

function getInitials(userLabel?: string | null) {
  if (!userLabel) {
    return "CC";
  }

  const parts = userLabel.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "CC";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getActionClasses(disabled?: boolean) {
  return [
    "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all",
    disabled
      ? "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
      : "bg-gradient-to-br from-primary to-primary-container hover:-translate-y-0.5 hover:shadow-primary/30 active:translate-y-0",
  ].join(" ");
}

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

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/78 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-headline text-2xl font-extrabold tracking-tight text-slate-900">
            CognitiveCanvas
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive = activeNav === item.key || pathname === item.href;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-blue-50 text-primary"
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">{searchSlot}</div>
          {extraActions}
          {actionLabel && actionHref ? (
            <Link href={actionHref} className={getActionClasses(actionDisabled)} aria-disabled={actionDisabled}>
              {actionIcon ? <span className="material-symbols-outlined text-[18px]">{actionIcon}</span> : null}
              <span>{actionLabel}</span>
            </Link>
          ) : null}
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              disabled={actionDisabled}
              className={getActionClasses(actionDisabled)}
            >
              {actionIcon ? <span className="material-symbols-outlined text-[18px]">{actionIcon}</span> : null}
              <span>{actionLabel}</span>
            </button>
          ) : null}
          <div className="hidden items-center gap-3 pl-3 md:flex md:border-l md:border-slate-200/70">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-tertiary text-xs font-bold text-white shadow-md shadow-primary/20">
              {getInitials(userLabel)}
            </div>
            <div className="max-w-[180px]">
              <div className="truncate text-sm font-semibold text-slate-900">{userLabel || "CognitiveCanvas"}</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Workspace</div>
            </div>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Sign Out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export function ProductFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-slate-50/90">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-8 py-6 text-xs text-slate-400 md:flex-row">
        <p>© 2026 CognitiveCanvas AI. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-5 text-slate-500">
          <span>Support</span>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Documentation</span>
        </div>
      </div>
    </footer>
  );
}