import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeMonthly = searchParams.get("monthly") === "true";

    const dateFilter = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    };
    const where = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    // Category breakdown (for pie chart) — group in JS for type-safety
    const expenses = await prisma.expense.findMany({
      where,
      select: { categoryId: true, amount: true },
    });

    const catAmounts = new Map<string, number>();
    for (const e of expenses) {
      catAmounts.set(e.categoryId, (catAmounts.get(e.categoryId) ?? 0) + e.amount);
    }

    const categoryIds = Array.from(catAmounts.keys());
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    });
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const breakdown = Array.from(catAmounts.entries())
      .map(([catId, total]) => ({
        categoryId: catId,
        name: catMap.get(catId)?.name ?? "Uncategorized",
        color: catMap.get(catId)?.color ?? "#64748b",
        total,
      }))
      .sort((a, b) => b.total - a.total);

    let monthlyComparison: Record<string, unknown>[] = [];

    if (includeMonthly) {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      const recentExpenses = await prisma.expense.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, amount: true, categoryId: true, category: { select: { name: true } } },
      });

      const monthMap = new Map<string, Record<string, unknown>>();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, { month: key, label: `${monthNames[d.getMonth()]} ${d.getFullYear()}` });
      }

      for (const e of recentExpenses) {
        const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
        const entry = monthMap.get(key);
        if (entry) {
          const catName = e.category?.name ?? "Uncategorized";
          entry[catName] = ((entry[catName] as number) ?? 0) + e.amount;
        }
      }

      monthlyComparison = Array.from(monthMap.values());
    }

    return NextResponse.json(
      { breakdown, monthlyComparison },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("By-category API error:", error);
    return NextResponse.json({ error: "Failed to fetch category data" }, { status: 500 });
  }
}
