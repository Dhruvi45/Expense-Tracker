import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeMonthly = searchParams.get("monthly") === "true";

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage: Record<string, unknown> = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    // Category breakdown (for pie chart)
    const breakdown = await db
      .collection("expenses")
      .aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            categoryId: { $toString: "$_id" },
            name: { $ifNull: ["$category.name", "Uncategorized"] },
            color: { $ifNull: ["$category.color", "#64748b"] },
            total: 1,
          },
        },
      ])
      .toArray();

    let monthlyComparison: Record<string, unknown>[] = [];

    if (includeMonthly) {
      // Category comparison across months (for stacked bar chart)
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const raw = await db
        .collection("expenses")
        .aggregate([
          { $match: { date: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
                categoryId: "$categoryId",
              },
              total: { $sum: "$amount" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "_id.categoryId",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ])
        .toArray();

      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      // Group by month
      const monthMap = new Map<string, Record<string, unknown>>();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, {
          month: key,
          label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        });
      }

      for (const item of raw) {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
        const entry = monthMap.get(key);
        if (entry) {
          const catName = item.category?.name || "Uncategorized";
          entry[catName] = (((entry[catName] as number) || 0) + item.total) as number;
        }
      }

      monthlyComparison = Array.from(monthMap.values());
    }

    return NextResponse.json({ breakdown, monthlyComparison });
  } catch (error) {
    console.error("By-category API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category data" },
      { status: 500 }
    );
  }
}
