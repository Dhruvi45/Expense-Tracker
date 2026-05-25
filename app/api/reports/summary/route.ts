import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [thisMonthAgg, lastMonthAgg, topCategoryAgg, totalCount, categoryCount] =
      await Promise.all([
        prisma.expense.aggregate({
          where: { date: { gte: thisMonthStart } },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
          _sum: { amount: true },
        }),
        prisma.expense.groupBy({
          by: ["categoryId"],
          where: { date: { gte: thisMonthStart } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: 5,
        }),
        prisma.expense.count(),
        prisma.category.count(),
      ]);

    const totalThisMonth = thisMonthAgg._sum.amount ?? 0;
    const totalLastMonth = lastMonthAgg._sum.amount ?? 0;
    const percentChange =
      totalLastMonth > 0
        ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
        : totalThisMonth > 0
        ? 100
        : 0;

    // Resolve category names/colors for the top groups
    const categoryIds = topCategoryAgg.map((g) => g.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    });
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const topCategories = topCategoryAgg.map((g) => ({
      name: catMap.get(g.categoryId)?.name ?? "Uncategorized",
      color: catMap.get(g.categoryId)?.color ?? "#64748b",
      total: g._sum.amount ?? 0,
    }));

    return NextResponse.json(
      { totalThisMonth, totalLastMonth, percentChange: Math.round(percentChange * 100) / 100, topCategories, totalCount, categoryCount },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
