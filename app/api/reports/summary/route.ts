import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Total this month
    const thisMonthResult = await db
      .collection("expenses")
      .aggregate([
        { $match: { date: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();

    // Total last month
    const lastMonthResult = await db
      .collection("expenses")
      .aggregate([
        { $match: { date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();

    const totalThisMonth = thisMonthResult[0]?.total || 0;
    const totalLastMonth = lastMonthResult[0]?.total || 0;
    const percentChange =
      totalLastMonth > 0
        ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
        : totalThisMonth > 0
        ? 100
        : 0;

    // Top 5 categories this month
    const topCategories = await db
      .collection("expenses")
      .aggregate([
        { $match: { date: { $gte: thisMonthStart } } },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
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
            name: { $ifNull: ["$category.name", "Uncategorized"] },
            color: { $ifNull: ["$category.color", "#64748b"] },
            total: 1,
          },
        },
      ])
      .toArray();

    // Total expense count
    const totalCount = await db.collection("expenses").countDocuments();

    // Total categories count
    const categoryCount = await db.collection("categories").countDocuments();

    return NextResponse.json({
      totalThisMonth,
      totalLastMonth,
      percentChange: Math.round(percentChange * 100) / 100,
      topCategories,
      totalCount,
      categoryCount,
    });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
