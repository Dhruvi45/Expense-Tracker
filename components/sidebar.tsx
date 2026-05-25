"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Tags,
  BarChart3,
  Flame,
  Milk,
  Wallet,
  PiggyBank,
  TrendingUp,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const allNavItems = [
  { href: "/", label: "Expenses", icon: Receipt },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/gas-cylinder", label: "Gas", icon: Flame },
  { href: "/milk", label: "Milk", icon: Milk },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

// First 4 items pinned, rest in "More" drawer
const primaryNav = allNavItems.slice(0, 4);
const secondaryNav = allNavItems.slice(4);

export function Sidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const anySecondaryActive = secondaryNav.some((item) => isActive(item.href));

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Receipt className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Expense Tracker</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {allNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Mobile top header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur-sm px-4 md:hidden">
        <Receipt className="h-5 w-5 text-primary" />
        <span className="ml-2 text-base font-semibold">Expense Tracker</span>
      </header>

      {/* ── More drawer backdrop ── */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* ── More drawer sheet ── */}
      <div
        className={cn(
          "fixed left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-in-out",
          "bg-background border-t border-border rounded-t-2xl shadow-2xl",
          moreOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          bottom: 0,
          paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between px-5 py-2">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            More
          </span>
          <button
            onClick={() => setMoreOpen(false)}
            className="rounded-full p-1.5 hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 px-3 pb-4">
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  isActive(item.href) ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
              </div>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav
        className="fixed left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-sm border-t border-border"
        style={{
          bottom: 0,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-stretch h-16">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200",
                  isActive(item.href) ? "bg-primary/15" : ""
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive(item.href) && "stroke-[2.5]"
                  )}
                />
              </div>
              {item.label}
            </Link>
          ))}

          {/* More button */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              anySecondaryActive || moreOpen
                ? "text-primary"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200",
                anySecondaryActive || moreOpen ? "bg-primary/15" : ""
              )}
            >
              <MoreHorizontal
                className={cn(
                  "h-5 w-5 transition-all",
                  (anySecondaryActive || moreOpen) && "stroke-[2.5]"
                )}
              />
            </div>
            More
          </button>
        </div>
      </nav>
    </>
  );
}
