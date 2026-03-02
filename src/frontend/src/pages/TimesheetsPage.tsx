import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Edit2,
  Filter,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { TimesheetEntry } from "../backend.d";
import {
  useActiveEmployees,
  useAddEntry,
  useDeleteEntry,
  useEntries,
  useUpdateEntry,
  useUpdateEntryStatus,
} from "../hooks/useQueries";
import {
  calcHours,
  formatDate,
  formatTime,
  todayISO,
} from "../utils/timesheet";

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

interface EntryFormData {
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  site: string;
  notes: string;
}

const defaultForm: EntryFormData = {
  employeeId: "",
  date: todayISO(),
  clockIn: "08:00",
  clockOut: "16:00",
  site: "",
  notes: "",
};

export default function TimesheetsPage() {
  const { data: entries = [], isLoading: entriesLoading } = useEntries();
  const { data: activeEmployees = [], isLoading: empLoading } =
    useActiveEmployees();

  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const updateStatus = useUpdateEntryStatus();

  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Entry form modal
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const [form, setForm] = useState<EntryFormData>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<EntryFormData>>({});

  // Delete confirm modal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const isLoading = entriesLoading || empLoading;

  // Employee name lookup
  const employeeMap = useMemo(
    () => new Map(activeEmployees.map((e) => [e.id.toString(), e.name])),
    [activeEmployees],
  );

  // All employees (include inactive ones referenced in entries)
  const allEntriesEmployees = useMemo(() => {
    const ids = new Set(entries.map((e) => e.employeeId.toString()));
    return Array.from(ids).map((id) => ({
      id,
      name: employeeMap.get(id) ?? `Employee #${id}`,
    }));
  }, [entries, employeeMap]);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (
          filterEmployee !== "all" &&
          e.employeeId.toString() !== filterEmployee
        )
          return false;
        if (filterStatus !== "all" && e.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, filterEmployee, filterStatus]);

  function openAddModal() {
    setEditingEntry(null);
    setForm({ ...defaultForm, date: todayISO() });
    setFormErrors({});
    setEntryModalOpen(true);
  }

  function openEditModal(entry: TimesheetEntry) {
    setEditingEntry(entry);
    setForm({
      employeeId: entry.employeeId.toString(),
      date: entry.date,
      clockIn: entry.clockIn,
      clockOut: entry.clockOut,
      site: entry.site,
      notes: entry.notes,
    });
    setFormErrors({});
    setEntryModalOpen(true);
  }

  function validateForm(): boolean {
    const errors: Partial<EntryFormData> = {};
    if (!form.employeeId) errors.employeeId = "Required";
    if (!form.date) errors.date = "Required";
    if (!form.clockIn) errors.clockIn = "Required";
    if (!form.clockOut) errors.clockOut = "Required";
    if (!form.site.trim()) errors.site = "Required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmitEntry() {
    if (!validateForm()) return;

    const hours = calcHours(form.clockIn, form.clockOut);
    const employeeId = BigInt(form.employeeId);

    try {
      if (editingEntry) {
        await updateEntry.mutateAsync({
          id: editingEntry.id,
          employeeId,
          date: form.date,
          clockIn: form.clockIn,
          clockOut: form.clockOut,
          site: form.site.trim(),
          notes: form.notes.trim(),
          hoursWorked: hours,
          status: editingEntry.status,
        });
        toast.success("Entry updated successfully");
      } else {
        await addEntry.mutateAsync({
          employeeId,
          date: form.date,
          clockIn: form.clockIn,
          clockOut: form.clockOut,
          site: form.site.trim(),
          notes: form.notes.trim(),
          hoursWorked: hours,
        });
        toast.success("Entry added successfully");
      }
      setEntryModalOpen(false);
    } catch {
      toast.error("Failed to save entry");
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteEntry.mutateAsync(deletingId);
      toast.success("Entry deleted");
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  async function handleApprove(id: bigint) {
    try {
      await updateStatus.mutateAsync({ id, status: "Approved" });
      toast.success("Entry approved");
    } catch {
      toast.error("Failed to approve entry");
    }
  }

  async function handleReject(id: bigint) {
    try {
      await updateStatus.mutateAsync({ id, status: "Rejected" });
      toast.success("Entry rejected");
    } catch {
      toast.error("Failed to reject entry");
    }
  }

  const isPending = addEntry.isPending || updateEntry.isPending;

  const hoursPreview =
    form.clockIn && form.clockOut
      ? calcHours(form.clockIn, form.clockOut)
      : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Timesheets
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and review all timesheet entries
          </p>
        </div>
        <Button
          data-ocid="timesheets.add_entry.button"
          onClick={openAddModal}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-glow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="py-3 px-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
            <div className="flex flex-wrap gap-3 w-full">
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-full sm:w-48 bg-muted/30 border-border text-sm">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {allEntriesEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40 bg-muted/30 border-border text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {(filterEmployee !== "all" || filterStatus !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterEmployee("all");
                    setFilterStatus("all");
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card data-ocid="timesheets.table" className="border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-16"
              data-ocid="timesheets.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-16 text-muted-foreground text-sm"
              data-ocid="timesheets.empty_state"
            >
              No timesheet entries found.
              {(filterEmployee !== "all" || filterStatus !== "all") && (
                <span> Try clearing the filters.</span>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
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
                      Clock In
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Clock Out
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Hours
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, idx) => {
                    const empName =
                      employeeMap.get(entry.employeeId.toString()) ??
                      `#${entry.employeeId}`;
                    const displayIdx = idx + 1;
                    return (
                      <motion.tr
                        key={entry.id.toString()}
                        data-ocid={`timesheets.entry.item.${displayIdx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-t border-border hover:bg-muted/20 transition-colors group"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {empName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {entry.site}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">
                          {formatTime(entry.clockIn)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">
                          {formatTime(entry.clockOut)}
                        </td>
                        <td className="px-4 py-3 text-foreground font-mono text-xs hidden lg:table-cell">
                          {entry.hoursWorked.toFixed(2)}h
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={entry.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {entry.status === "Pending" && (
                              <>
                                <Button
                                  data-ocid={`timesheets.approve.button.${displayIdx}`}
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  title="Approve"
                                  onClick={() => handleApprove(entry.id)}
                                  disabled={updateStatus.isPending}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  data-ocid={`timesheets.reject.button.${displayIdx}`}
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="Reject"
                                  onClick={() => handleReject(entry.id)}
                                  disabled={updateStatus.isPending}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              data-ocid={`timesheets.edit_entry.button.${displayIdx}`}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              title="Edit"
                              onClick={() => openEditModal(entry)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              data-ocid={`timesheets.delete_entry.button.${displayIdx}`}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                              onClick={() => {
                                setDeletingId(entry.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Modal */}
      <Dialog open={entryModalOpen} onOpenChange={setEntryModalOpen}>
        <DialogContent
          data-ocid="entry_form.dialog"
          className="sm:max-w-[500px] bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {editingEntry ? "Edit Entry" : "Add Timesheet Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Employee */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Employee *
              </Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}
              >
                <SelectTrigger
                  data-ocid="entry_form.employee.select"
                  className={`bg-muted/30 border-border ${formErrors.employeeId ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select employee…" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id.toString()} value={e.id.toString()}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.employeeId && (
                <p className="text-xs text-destructive">
                  {formErrors.employeeId}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Date *</Label>
              <Input
                data-ocid="entry_form.date.input"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className={`bg-muted/30 border-border ${formErrors.date ? "border-destructive" : ""}`}
              />
              {formErrors.date && (
                <p className="text-xs text-destructive">{formErrors.date}</p>
              )}
            </div>

            {/* Clock In/Out */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">
                  Clock In *
                </Label>
                <Input
                  data-ocid="entry_form.clock_in.input"
                  type="time"
                  value={form.clockIn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clockIn: e.target.value }))
                  }
                  className={`bg-muted/30 border-border ${formErrors.clockIn ? "border-destructive" : ""}`}
                />
                {formErrors.clockIn && (
                  <p className="text-xs text-destructive">
                    {formErrors.clockIn}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">
                  Clock Out *
                </Label>
                <Input
                  data-ocid="entry_form.clock_out.input"
                  type="time"
                  value={form.clockOut}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clockOut: e.target.value }))
                  }
                  className={`bg-muted/30 border-border ${formErrors.clockOut ? "border-destructive" : ""}`}
                />
                {formErrors.clockOut && (
                  <p className="text-xs text-destructive">
                    {formErrors.clockOut}
                  </p>
                )}
              </div>
            </div>

            {/* Hours preview */}
            {hoursPreview !== null && (
              <p className="text-xs text-primary font-medium">
                ⏱ Calculated hours:{" "}
                <span className="font-mono">{hoursPreview.toFixed(2)}h</span>
              </p>
            )}

            {/* Site */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Site *</Label>
              <Input
                data-ocid="entry_form.site.input"
                placeholder="e.g. Main Gate, Warehouse…"
                value={form.site}
                onChange={(e) =>
                  setForm((f) => ({ ...f, site: e.target.value }))
                }
                className={`bg-muted/30 border-border ${formErrors.site ? "border-destructive" : ""}`}
              />
              {formErrors.site && (
                <p className="text-xs text-destructive">{formErrors.site}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Notes</Label>
              <Textarea
                data-ocid="entry_form.notes.textarea"
                placeholder="Optional shift notes…"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="bg-muted/30 border-border resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              data-ocid="entry_form.cancel_button"
              variant="outline"
              onClick={() => setEntryModalOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              data-ocid="entry_form.submit_button"
              onClick={handleSubmitEntry}
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : editingEntry ? (
                "Update Entry"
              ) : (
                "Add Entry"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          data-ocid="delete_confirm.dialog"
          className="sm:max-w-[380px] bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Delete Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete this timesheet entry? This action
            cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              data-ocid="delete_confirm.cancel_button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              data-ocid="delete_confirm.confirm_button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
            >
              {deleteEntry.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
