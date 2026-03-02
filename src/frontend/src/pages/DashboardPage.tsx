import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ChevronRight, Clock, Loader2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import type { TimesheetEntry } from "../backend.d";
import { useEntries } from "../hooks/useQueries";
import { useEmployees } from "../hooks/useQueries";
import {
  formatDate,
  formatTime,
  getWeekEnd,
  getWeekStart,
} from "../utils/timesheet";

type Tab = "dashboard" | "timesheets" | "employees";

interface Props {
  onNavigate: (tab: Tab) => void;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Approved"
      ? "status-badge-approved"
      : status === "Rejected"
        ? "status-badge-rejected"
        : "status-badge-pending";
  return (
    <span className={`${cls} text-xs px-2 py-0.5 rounded-full font-medium`}>
      {status}
    </span>
  );
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export default function DashboardPage({ onNavigate }: Props) {
  const { data: entries = [], isLoading: entriesLoading } = useEntries();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  const isLoading = entriesLoading || employeesLoading;

  const stats = useMemo(() => {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd(weekStart);

    const weekEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    });

    const totalHours = weekEntries.reduce((sum, e) => sum + e.hoursWorked, 0);
    const pending = entries.filter((e) => e.status === "Pending").length;
    const activeCount = employees.filter((e) => e.active).length;

    return { totalHours, pending, activeCount };
  }, [entries, employees]);

  const recentEntries = useMemo(() => {
    const employeeMap = new Map(
      employees.map((e) => [e.id.toString(), e.name]),
    );
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((entry) => ({
        ...entry,
        employeeName: employeeMap.get(entry.employeeId.toString()) ?? "Unknown",
      }));
  }, [entries, employees]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-24"
        data-ocid="dashboard.loading_state"
      >
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          Dashboard
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Weekly overview & recent activity
        </p>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Total Hours */}
        <motion.div variants={cardVariants}>
          <Card
            data-ocid="dashboard.total_hours.card"
            className="border-border bg-card relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Hours This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-bold text-foreground">
                {stats.totalHours.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Logged hours (Mon–Sun)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Approvals */}
        <motion.div variants={cardVariants}>
          <Card
            data-ocid="dashboard.pending.card"
            className="border-border bg-card relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle
                  className="w-4 h-4"
                  style={{ color: "oklch(var(--status-pending))" }}
                />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-bold text-foreground">
                {stats.pending}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Entries awaiting review
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Employees */}
        <motion.div variants={cardVariants}>
          <Card
            data-ocid="dashboard.active_employees.card"
            className="border-border bg-card relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users
                  className="w-4 h-4"
                  style={{ color: "oklch(var(--status-approved))" }}
                />
                Active Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-bold text-foreground">
                {stats.activeCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Currently on roster
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Entries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="font-display text-lg font-bold">
                Recent Entries
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Latest 10 timesheet records
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("timesheets")}
              className="border-border text-muted-foreground hover:text-foreground gap-1"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentEntries.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                No entries yet. Add a timesheet entry to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                        Site
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Hours
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEntries.map((entry) => (
                      <tr
                        key={entry.id.toString()}
                        className="border-t border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {entry.employeeName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {entry.site}
                        </td>
                        <td className="px-4 py-3 text-foreground font-mono text-xs hidden md:table-cell">
                          {entry.hoursWorked.toFixed(2)}h
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={entry.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
