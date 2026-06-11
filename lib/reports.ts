import { prisma } from "@/lib/prisma";
import type { MonthlyTrend, CategoryBreakdown } from "@/lib/types";

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Total spend per month for the last `months` months (oldest first). */
export async function getMonthlyTrends(months = 12): Promise<MonthlyTrend[]> {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: from } },
    select: { date: true, amount: true },
  });

  const grouped = new Map<string, number>();
  for (const e of expenses) {
    const key = monthKey(e.date);
    grouped.set(key, (grouped.get(key) ?? 0) + e.amount);
  }

  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    return { month: monthKey(d), label: monthLabel(d), total: grouped.get(monthKey(d)) ?? 0 };
  });
}

/**
 * Spend per category, optionally bounded by a date range.
 * Defaults to the last 12 months so the query never scans the full collection.
 */
export async function getCategoryBreakdown(
  startDate?: string,
  endDate?: string
): Promise<CategoryBreakdown[]> {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const grouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: {
      date: {
        gte: startDate ? new Date(startDate) : defaultStart,
        ...(endDate ? { lte: new Date(endDate) } : {}),
      },
    },
    _sum: { amount: true },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
    select: { id: true, name: true, color: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return grouped
    .map((g) => ({
      categoryId: g.categoryId,
      name: catMap.get(g.categoryId)?.name ?? "Uncategorized",
      color: catMap.get(g.categoryId)?.color ?? "#64748b",
      total: g._sum.amount ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Per-month, per-category totals for stacked comparison charts (last `months` months). */
export async function getMonthlyComparison(
  months = 6
): Promise<Record<string, unknown>[]> {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: from } },
    select: { date: true, amount: true, category: { select: { name: true } } },
  });

  const monthMap = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    monthMap.set(monthKey(d), { month: monthKey(d), label: monthLabel(d) });
  }

  for (const e of expenses) {
    const entry = monthMap.get(monthKey(e.date));
    if (entry) {
      const catName = e.category?.name ?? "Uncategorized";
      entry[catName] = ((entry[catName] as number) ?? 0) + e.amount;
    }
  }

  return Array.from(monthMap.values());
}

/** Top spending categories for the current month. */
export async function getTopCategories(
  limit = 5
): Promise<{ name: string; color: string; total: number }[]> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const grouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { date: { gte: monthStart } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
    select: { id: true, name: true, color: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return grouped.map((g) => ({
    name: catMap.get(g.categoryId)?.name ?? "Uncategorized",
    color: catMap.get(g.categoryId)?.color ?? "#64748b",
    total: g._sum.amount ?? 0,
  }));
}
