"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runMonthStart } from "@/app/accounts/actions";
import { RefreshCw, CheckCircle } from "lucide-react";

export function RunMonthStartButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    setDone(false);

    const result = await runMonthStart();
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={run} disabled={loading}>
        {done ? (
          <><CheckCircle className="mr-2 h-4 w-4 text-green-500" />Allocations Applied</>
        ) : (
          <><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Run Month-Start Allocation</>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
