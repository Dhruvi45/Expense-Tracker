import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { AccountDoc, AccountTransactionDoc, SavingsConfigDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Security: require Bearer token matching CRON_SECRET (or "dev" in development)
  const secret = process.env.CRON_SECRET ?? "dev";
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const results: { accountId: string; name: string; allocated: number; skipped?: boolean }[] = [];

  // ---- 1. Process expense account allocations ----
  const accounts = await db
    .collection<AccountDoc>("accounts")
    .find({})
    .toArray();

  for (const account of accounts) {
    if (!account.monthlyAllocation || account.monthlyAllocation <= 0) {
      results.push({ accountId: account._id.toHexString(), name: account.name, allocated: 0, skipped: true });
      continue;
    }

    // Idempotency check: has this month's allocation already been applied?
    const already = await db.collection<AccountTransactionDoc>("accountTransactions").findOne({
      accountId: account._id,
      reason: "monthly_allocation",
      date: { $gte: monthStart },
    });

    if (already) {
      results.push({ accountId: account._id.toHexString(), name: account.name, allocated: 0, skipped: true });
      continue;
    }

    await db.collection("accounts").updateOne(
      { _id: account._id },
      { $inc: { currentBalance: account.monthlyAllocation } }
    );

    await db.collection("accountTransactions").insertOne({
      accountId: account._id,
      type: "credit",
      amount: account.monthlyAllocation,
      reason: "monthly_allocation",
      note: `Auto-allocation for ${currentMonth}`,
      date: monthStart,
      createdAt: new Date(),
    });

    results.push({
      accountId: account._id.toHexString(),
      name: account.name,
      allocated: account.monthlyAllocation,
    });
  }

  // ---- 2. Process savings auto-deposit ----
  const savingsConfig = await db
    .collection<SavingsConfigDoc>("savingsConfig")
    .findOne({});
  const autoDeposit = savingsConfig?.monthlyAutoDeposit ?? 0;
  let savingsSkipped = false;
  let savingsDeposited = 0;

  if (autoDeposit > 0) {
    const alreadySaved = await db.collection("savingsEntries").findOne({
      reason: "monthly_auto",
      date: { $gte: monthStart },
    });

    if (!alreadySaved) {
      await db.collection("savingsEntries").insertOne({
        type: "deposit",
        amount: autoDeposit,
        reason: "monthly_auto",
        note: `Auto-deposit for ${currentMonth}`,
        date: monthStart,
        createdAt: new Date(),
      });
      savingsDeposited = autoDeposit;
    } else {
      savingsSkipped = true;
    }
  } else {
    savingsSkipped = true;
  }

  return NextResponse.json({
    success: true,
    month: currentMonth,
    accounts: results,
    savings: {
      deposited: savingsDeposited,
      skipped: savingsSkipped,
    },
  });
}

// Allow Vercel cron to call via GET as well
export async function GET(req: NextRequest) {
  return POST(req);
}
