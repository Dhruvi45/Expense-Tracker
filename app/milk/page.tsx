export const dynamic = "force-dynamic";

import { getMilkEntries, getMilkMonthlySummaries, getMilkSettings } from "./actions";
import { MilkPageClient } from "@/components/milk-page-client";

export default async function MilkPage() {
  const [entries, monthlySummaries, settings] = await Promise.all([
    getMilkEntries(),
    getMilkMonthlySummaries(),
    getMilkSettings(),
  ]);

  return (
    <MilkPageClient
      initialEntries={entries}
      monthlySummaries={monthlySummaries}
      milkSettings={settings}
    />
  );
}
