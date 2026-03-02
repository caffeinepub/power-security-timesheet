import { Toaster } from "@/components/ui/sonner";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "./hooks/useActor";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import TimesheetsPage from "./pages/TimesheetsPage";
import { seedIfEmpty } from "./utils/seed";

type Tab = "dashboard" | "timesheets" | "employees";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (actor && !isFetching) {
      seedIfEmpty(actor).catch(console.error);
    }
  }, [actor, isFetching]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-sidebar shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Shield
                className="w-5 h-5 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold text-foreground leading-tight tracking-tight">
                Power Security
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Timesheet Management
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="font-display text-base font-bold text-foreground leading-tight">
                Power Security
              </h1>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1">
            {(
              [
                {
                  key: "dashboard",
                  label: "Dashboard",
                  ocid: "nav.dashboard.tab",
                },
                {
                  key: "timesheets",
                  label: "Timesheets",
                  ocid: "nav.timesheets.tab",
                },
                {
                  key: "employees",
                  label: "Employees",
                  ocid: "nav.employees.tab",
                },
              ] as { key: Tab; label: string; ocid: string }[]
            ).map(({ key, label, ocid }) => (
              <button
                key={key}
                type="button"
                data-ocid={ocid}
                onClick={() => setActiveTab(key)}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                  activeTab === key
                    ? "bg-primary text-primary-foreground shadow-glow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === "dashboard" && (
          <DashboardPage onNavigate={setActiveTab} />
        )}
        {activeTab === "timesheets" && <TimesheetsPage />}
        {activeTab === "employees" && <EmployeesPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-primary">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
