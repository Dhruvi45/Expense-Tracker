"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle } from "lucide-react";

export function RunMonthStartButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    setDone(false);
    try {
      const res = await fetch("/api/cron/month-start", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? "dev"}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to run allocation");
      } else {
        setDone(true);
        setTimeout(() => setDone(false), 3000);
        window.location.reload();
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
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
