import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Fetch raw expense dates + amounts and group in JS (cleaner than raw aggregation)
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: twelveMonthsAgo } },
      select: { date: true, amount: true },
    });

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const grouped = new Map<string, number>();
    for (const e of expenses) {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
      grouped.set(key, (grouped.get(key) ?? 0) + e.amount);
    }

    const trends = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { month: key, label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, total: grouped.get(key) ?? 0 };
    });

    return NextResponse.json(trends, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Trends API error:", error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
