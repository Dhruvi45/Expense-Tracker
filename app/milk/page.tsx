export const dynamic = "force-dynamic";

import { getMilkEntries, getMilkMonthlySummaries, deleteMilkEntry } from "./actions";
import { MilkPageClient } from "@/components/milk-page-client";

export default async function MilkPage() {
  const [entries, monthlySummaries] = await Promise.all([
    getMilkEntries(),
    getMilkMonthlySummaries(),
  ]);

  return (
    <MilkPageClient
      initialEntries={entries}
      monthlySummaries={monthlySummaries}
    />
  );
}
