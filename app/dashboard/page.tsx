import { DashboardContent } from "@/components/dashboard-content";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your expense tracking
        </p>
      </div>
      <DashboardContent />
    </div>
  );
}
