import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { TimesheetEntry } from "../backend.d";
import { useDeleteEntry, useEntries } from "../hooks/useQueries";
import type { TimesheetFormData } from "./TimesheetsPage";

interface Props {
  onLoadTimesheet: (data: TimesheetFormData, entryId: bigint) => void;
}

function parseEntryToFormData(entry: TimesheetEntry): TimesheetFormData | null {
  try {
    const data = JSON.parse(entry.notes) as TimesheetFormData;
    // Basic validation
    if (!Array.isArray(data.week1Rows) || !Array.isArray(data.week2Rows))
      return null;
    return data;
  } catch {
    return null;
  }
}

function parseEmployeeName(site: string): string {
  if (!site) return "Unknown Employee";
  const [last, first] = site.split(",");
  if (first?.trim()) {
    return `${first.trim()} ${last.trim()}`;
  }
  return last.trim() || "Unknown Employee";
}

function formatPayPeriod(start: string, end: string): string {
  if (!start && !end) return "Unknown pay period";
  const fmt = (d: string) => {
    if (!d) return "?";
    const [year, month, day] = d.split("-").map(Number);
    return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function SavedTimesheetsPage({ onLoadTimesheet }: Props) {
  const { data: entries = [], isLoading } = useEntries();
  const deleteEntry = useDeleteEntry();

  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  // Only show entries that look like saved timesheet forms (have JSON notes with week rows)
  const timesheets = entries
    .filter((e) => {
      try {
        const d = JSON.parse(e.notes);
        return Array.isArray(d.week1Rows);
      } catch {
        return false;
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEntry.mutateAsync(deleteId);
      toast.success("Timesheet deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete timesheet.");
    }
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-24"
        data-ocid="saved_timesheets.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
          Saved Timesheets
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Click "Load" to edit a previously saved timesheet.
        </p>
      </div>

      {timesheets.length === 0 ? (
        <div
          className="text-center py-16 border border-dashed border-border rounded"
          data-ocid="saved_timesheets.empty_state"
        >
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">
            No saved timesheets yet.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Fill out and save a timesheet to see it here.
          </p>
        </div>
      ) : (
        <div
          className="border border-border overflow-hidden"
          data-ocid="saved_timesheets.list"
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: "oklch(0.18 0.01 250)",
                  color: "white",
                }}
              >
                <th className="text-left px-4 py-3 font-display font-bold uppercase tracking-wide text-xs">
                  Employee Name
                </th>
                <th className="text-left px-4 py-3 font-display font-bold uppercase tracking-wide text-xs">
                  Pay Period
                </th>
                <th className="text-right px-4 py-3 font-display font-bold uppercase tracking-wide text-xs">
                  Total Hours
                </th>
                <th className="text-right px-4 py-3 font-display font-bold uppercase tracking-wide text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((entry, idx) => {
                const name = parseEmployeeName(entry.site);
                const formData = parseEntryToFormData(entry);
                const payPeriod = formatPayPeriod(
                  formData?.payPeriodStart ?? entry.clockIn ?? "",
                  formData?.payPeriodEnd ?? entry.clockOut ?? "",
                );
                const displayIdx = idx + 1;

                return (
                  <tr
                    key={entry.id.toString()}
                    data-ocid={`saved_timesheets.item.${displayIdx}`}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {payPeriod}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                      {entry.hoursWorked.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          data-ocid={`saved_timesheets.load.button.${displayIdx}`}
                          size="sm"
                          variant="outline"
                          disabled={!formData}
                          onClick={() => {
                            if (formData) onLoadTimesheet(formData, entry.id);
                          }}
                          className="text-xs"
                        >
                          Load
                        </Button>
                        <Button
                          data-ocid={`saved_timesheets.delete_button.${displayIdx}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(entry.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="delete_confirm.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Timesheet?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this saved timesheet. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="delete_confirm.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="delete_confirm.confirm_button"
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEntry.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
