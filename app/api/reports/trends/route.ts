import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    // Last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthlyData = await db
      .collection("expenses")
      .aggregate([
        { $match: { date: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    // Fill in all 12 months (even if no data)
    const trends = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-based

      const found = monthlyData.find(
        (m) => m._id.year === year && m._id.month === month
      );

      trends.push({
        month: `${year}-${String(month).padStart(2, "0")}`,
        label: `${monthNames[month - 1]} ${year}`,
        total: found?.total || 0,
        count: found?.count || 0,
      });
    }

    return NextResponse.json(trends);
  } catch (error) {
    console.error("Trends API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}
