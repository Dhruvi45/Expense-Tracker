import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — Expense Tracker",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold">You&apos;re offline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Expense Tracker needs a connection to load your data.
          <br />
          Check your network and try again.
        </p>
      </div>
      <a
        href="/expenses"
        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Retry
      </a>
    </div>
  );
}
