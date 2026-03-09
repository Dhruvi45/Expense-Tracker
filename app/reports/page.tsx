import { ReportsContent } from "@/components/reports-content";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Detailed charts and comparisons of your spending
        </p>
      </div>
      <ReportsContent />
    </div>
  );
}
