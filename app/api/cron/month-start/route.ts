import { NextRequest, NextResponse } from "next/server";
import { runMonthStartAllocation } from "@/lib/month-start";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "dev";
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runMonthStartAllocation();
  return NextResponse.json({ success: true, ...result });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
