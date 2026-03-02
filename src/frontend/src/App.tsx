import { Toaster } from "@/components/ui/sonner";
import { FileText, Shield } from "lucide-react";
import { useState } from "react";
import SavedTimesheetsPage from "./pages/DashboardPage";
import TimesheetsPage from "./pages/TimesheetsPage";
import type { TimesheetFormData } from "./pages/TimesheetsPage";

type Tab = "new" | "saved";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [loadedEntryId, setLoadedEntryId] = useState<bigint | null>(null);
  const [loadedData, setLoadedData] = useState<TimesheetFormData | null>(null);

  function handleLoadTimesheet(data: TimesheetFormData, entryId: bigint) {
    setLoadedData(data);
    setLoadedEntryId(entryId);
    setActiveTab("new");
  }

  function handleSaved() {
    setLoadedEntryId(null);
    setLoadedData(null);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="no-print sticky top-0 z-40 border-b border-border bg-white shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-primary">
              <Shield
                className="w-4.5 h-4.5 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <h1 className="font-display text-sm font-black uppercase tracking-widest text-foreground leading-tight">
                Power Security
              </h1>
              <p className="text-xs text-muted-foreground leading-tight hidden sm:block">
                Timesheet Management
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            <button
              type="button"
              data-ocid="nav.new_timesheet.tab"
              onClick={() => setActiveTab("new")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide rounded transition-all ${
                activeTab === "new"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Timesheet</span>
              <span className="sm:hidden">New</span>
            </button>
            <button
              type="button"
              data-ocid="nav.saved_timesheets.tab"
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide rounded transition-all ${
                activeTab === "saved"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="hidden sm:inline">Saved Timesheets</span>
              <span className="sm:hidden">Saved</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === "new" && (
          <TimesheetsPage
            loadedEntryId={loadedEntryId}
            loadedData={loadedData}
            onSaved={handleSaved}
          />
        )}
        {activeTab === "saved" && (
          <SavedTimesheetsPage onLoadTimesheet={handleLoadTimesheet} />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-border py-3 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center text-xs text-muted-foreground">
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
