"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Expenses", icon: Receipt },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/gas-cylinder", label: "Gas", icon: Flame },
  { href: "/milk", label: "Milk", icon: Milk },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Receipt className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Expense Tracker</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b border-border bg-background px-4 md:hidden">
        <Receipt className="h-5 w-5 text-primary" />
        <span className="ml-2 text-base font-semibold">Expense Tracker</span>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background md:hidden">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
