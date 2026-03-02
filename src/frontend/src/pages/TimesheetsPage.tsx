import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAddEntry, useUpdateEntry } from "../hooks/useQueries";
import {
  calcRowHours,
  formatDateUS,
  getCurrentPayPeriodStart,
  getPayPeriodDates,
  getPayPeriodEnd,
  getSignatureDate,
} from "../utils/timesheet";

// Day labels for 7 rows per week (Mon x2, Tue, Wed, Thu, Fri, Sun — no Saturday)
const DAY_LABELS = ["M", "M", "T", "W", "TH", "F", "SU"];

export interface WeekRow {
  jobLocation: string;
  date: string; // YYYY-MM-DD
  workStart: string;
  lunchOut: string;
  lunchIn: string;
  workEnd: string;
}

export interface TimesheetFormData {
  lastName: string;
  firstName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  week1Rows: WeekRow[];
  week2Rows: WeekRow[];
  signatureText: string;
  dateSigned: string;
}

// Pre-fill data for each of the 7 rows per week
// Rows: Mon(H.A.), Mon(Rover), Tue(H.A.), Wed(H.A.), Thu(H.A.), Fri(H.A.), Sun(Rover)
const WEEK_ROW_PREFILL = [
  {
    jobLocation: "H.A.",
    workStart: "8:00 AM",
    lunchOut: "12:00 PM",
    lunchIn: "1:00 PM",
    workEnd: "5:00 PM",
  },
  {
    jobLocation: "Rover",
    workStart: "7:30 PM",
    lunchOut: "",
    lunchIn: "",
    workEnd: "3:30 AM",
  },
  {
    jobLocation: "H.A.",
    workStart: "8:00 AM",
    lunchOut: "12:00 PM",
    lunchIn: "1:00 PM",
    workEnd: "5:00 PM",
  },
  {
    jobLocation: "H.A.",
    workStart: "8:00 AM",
    lunchOut: "12:00 PM",
    lunchIn: "1:00 PM",
    workEnd: "5:00 PM",
  },
  {
    jobLocation: "H.A.",
    workStart: "8:00 AM",
    lunchOut: "12:00 PM",
    lunchIn: "1:00 PM",
    workEnd: "5:00 PM",
  },
  {
    jobLocation: "H.A.",
    workStart: "8:00 AM",
    lunchOut: "12:00 PM",
    lunchIn: "1:00 PM",
    workEnd: "5:00 PM",
  },
  {
    jobLocation: "Rover",
    workStart: "7:30 PM",
    lunchOut: "",
    lunchIn: "",
    workEnd: "3:30 AM",
  },
];

function makeDefaultRows(dates: string[], prefill = false): WeekRow[] {
  return dates.map((date, idx) => {
    if (prefill && WEEK_ROW_PREFILL[idx]) {
      return { date, ...WEEK_ROW_PREFILL[idx] };
    }
    return {
      jobLocation: "",
      date,
      workStart: "",
      lunchOut: "",
      lunchIn: "",
      workEnd: "",
    };
  });
}

function makeDefaultForm(): TimesheetFormData {
  const start = getCurrentPayPeriodStart();
  const end = getPayPeriodEnd(start);
  const { week1, week2 } = getPayPeriodDates(start);
  return {
    lastName: "Getchell",
    firstName: "Sam",
    payPeriodStart: start,
    payPeriodEnd: end,
    week1Rows: makeDefaultRows(week1, true),
    week2Rows: makeDefaultRows(week2, true),
    signatureText: "Sam Getchell",
    dateSigned: getSignatureDate(end),
  };
}

interface Props {
  loadedEntryId?: bigint | null;
  loadedData?: TimesheetFormData | null;
  onSaved?: () => void;
}

export default function TimesheetsPage({
  loadedEntryId,
  loadedData,
  onSaved,
}: Props) {
  const [form, setForm] = useState<TimesheetFormData>(makeDefaultForm());

  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();

  const isSaving = addEntry.isPending || updateEntry.isPending;

  // When loadedData changes from parent, populate the form
  useEffect(() => {
    if (loadedData) {
      setForm(loadedData);
    }
  }, [loadedData]);

  // Re-generate dates when payPeriodStart changes
  const handlePayPeriodStartChange = useCallback((newStart: string) => {
    const newEnd = getPayPeriodEnd(newStart);
    const { week1, week2 } = getPayPeriodDates(newStart);
    setForm((prev) => {
      // Preserve any filled-in data but update dates
      const mergeRows = (existing: WeekRow[], newDates: string[]): WeekRow[] =>
        newDates.map((date, i) => ({
          ...(existing[i] ??
            WEEK_ROW_PREFILL[i] ?? {
              jobLocation: "",
              workStart: "",
              lunchOut: "",
              lunchIn: "",
              workEnd: "",
            }),
          date,
        }));
      return {
        ...prev,
        payPeriodStart: newStart,
        payPeriodEnd: newEnd,
        week1Rows: mergeRows(prev.week1Rows, week1),
        week2Rows: mergeRows(prev.week2Rows, week2),
        dateSigned: getSignatureDate(newEnd),
      };
    });
  }, []);

  function updateWeek1Row(idx: number, field: keyof WeekRow, value: string) {
    setForm((prev) => {
      const rows = [...prev.week1Rows];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, week1Rows: rows };
    });
  }

  function updateWeek2Row(idx: number, field: keyof WeekRow, value: string) {
    setForm((prev) => {
      const rows = [...prev.week2Rows];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, week2Rows: rows };
    });
  }

  // Calculate hours for a single row
  const rowHours = useCallback((row: WeekRow): number | null => {
    if (!row.workStart || !row.workEnd) return null;
    return calcRowHours(row.workStart, row.workEnd, row.lunchOut, row.lunchIn);
  }, []);

  const week1Total = useMemo(() => {
    return form.week1Rows.reduce((sum, row) => {
      const h = rowHours(row);
      return sum + (h ?? 0);
    }, 0);
  }, [form.week1Rows, rowHours]);

  const week2Total = useMemo(() => {
    return form.week2Rows.reduce((sum, row) => {
      const h = rowHours(row);
      return sum + (h ?? 0);
    }, 0);
  }, [form.week2Rows, rowHours]);

  const totalPayPeriodHours = week1Total + week2Total;

  async function handleSave() {
    if (!form.lastName.trim() && !form.firstName.trim()) {
      toast.error("Please enter an employee name before saving.");
      return;
    }

    const notes = JSON.stringify({
      lastName: form.lastName,
      firstName: form.firstName,
      payPeriodStart: form.payPeriodStart,
      payPeriodEnd: form.payPeriodEnd,
      week1Rows: form.week1Rows,
      week2Rows: form.week2Rows,
      signatureText: form.signatureText,
      dateSigned: form.dateSigned,
    });

    const site = `${form.lastName.trim()},${form.firstName.trim()}`;

    try {
      if (loadedEntryId) {
        await updateEntry.mutateAsync({
          id: loadedEntryId,
          employeeId: BigInt(0),
          date: form.payPeriodStart || new Date().toISOString().split("T")[0],
          clockIn: form.payPeriodStart,
          clockOut: form.payPeriodEnd,
          site,
          notes,
          hoursWorked: totalPayPeriodHours,
          status: "Pending",
        });
        toast.success("Timesheet updated successfully.");
      } else {
        await addEntry.mutateAsync({
          employeeId: BigInt(0),
          date: form.payPeriodStart || new Date().toISOString().split("T")[0],
          clockIn: form.payPeriodStart,
          clockOut: form.payPeriodEnd,
          site,
          notes,
          hoursWorked: totalPayPeriodHours,
        });
        toast.success("Timesheet saved successfully.");
        setForm(makeDefaultForm());
      }
      onSaved?.();
    } catch {
      toast.error("Failed to save timesheet. Please try again.");
    }
  }

  function shiftDateByDays(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  function handlePrevWeek() {
    handlePayPeriodStartChange(shiftDateByDays(form.payPeriodStart, -7));
  }

  function handleNextWeek() {
    handlePayPeriodStartChange(shiftDateByDays(form.payPeriodStart, 7));
  }

  function handlePrint() {
    window.print();
  }

  function handleNewForm() {
    setForm(makeDefaultForm());
    onSaved?.();
  }

  return (
    <div className="print-page">
      {/* Week shift controls - hidden when printing */}
      <div className="no-print flex items-center gap-3 mb-2 p-2 bg-muted/40 border border-border rounded">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Shift Pay Period:
        </span>
        <Button
          data-ocid="timesheet.prev_week.button"
          variant="outline"
          size="sm"
          onClick={handlePrevWeek}
          className="gap-1 text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous Week
        </Button>
        <Button
          data-ocid="timesheet.next_week.button"
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          className="gap-1 text-xs"
        >
          Next Week
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Print/Save actions - hidden when printing */}
      <div className="no-print flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {loadedEntryId && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
              Editing saved timesheet
            </span>
          )}
          {loadedEntryId && (
            <button
              type="button"
              onClick={handleNewForm}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Start new
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            data-ocid="timesheet.print.button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 border-border text-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </Button>
          <Button
            data-ocid="timesheet.save.button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-sm"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {isSaving
              ? "Saving…"
              : loadedEntryId
                ? "Update Timesheet"
                : "Save Timesheet"}
          </Button>
        </div>
      </div>

      {/* THE FORM */}
      <div className="bg-white border border-border shadow-paper p-6 sm:p-8 max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-5 pb-3 border-b-2 border-foreground">
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-widest uppercase text-foreground">
            Employee Time Sheet
          </h1>
        </div>

        {/* Header fields */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
          {/* Last Name */}
          <div className="flex items-end gap-2">
            <label
              htmlFor="ts-last-name"
              className="font-display text-xs font-bold uppercase tracking-wide whitespace-nowrap shrink-0"
            >
              Last Name:
            </label>
            <input
              id="ts-last-name"
              data-ocid="timesheet.last_name.input"
              type="text"
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
              className="flex-1 border-b border-foreground bg-transparent outline-none text-sm pb-0.5 font-sans min-w-0"
            />
          </div>
          {/* First Name */}
          <div className="flex items-end gap-2">
            <label
              htmlFor="ts-first-name"
              className="font-display text-xs font-bold uppercase tracking-wide whitespace-nowrap shrink-0"
            >
              First Name:
            </label>
            <input
              id="ts-first-name"
              data-ocid="timesheet.first_name.input"
              type="text"
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
              className="flex-1 border-b border-foreground bg-transparent outline-none text-sm pb-0.5 font-sans min-w-0"
            />
          </div>
          {/* Pay Period Start */}
          <div className="flex items-end gap-2">
            <label
              htmlFor="ts-pp-start"
              className="font-display text-xs font-bold uppercase tracking-wide whitespace-nowrap shrink-0"
            >
              Pay Period Start Date (Monday):
            </label>
            <input
              id="ts-pp-start"
              data-ocid="timesheet.pay_period_start.input"
              type="date"
              value={form.payPeriodStart}
              onChange={(e) => handlePayPeriodStartChange(e.target.value)}
              className="flex-1 border-b border-foreground bg-transparent outline-none text-sm pb-0.5 font-mono min-w-0"
            />
          </div>
          {/* Pay Period End */}
          <div className="flex items-end gap-2">
            <label
              htmlFor="ts-pp-end"
              className="font-display text-xs font-bold uppercase tracking-wide whitespace-nowrap shrink-0"
            >
              Pay Period End Date (Sunday):
            </label>
            <input
              id="ts-pp-end"
              data-ocid="timesheet.pay_period_end.input"
              type="date"
              value={form.payPeriodEnd}
              onChange={(e) =>
                setForm((f) => ({ ...f, payPeriodEnd: e.target.value }))
              }
              className="flex-1 border-b border-foreground bg-transparent outline-none text-sm pb-0.5 font-mono min-w-0"
            />
          </div>
        </div>

        {/* WEEK 1 TABLE */}
        <WeekTable
          weekLabel="WEEK 1"
          rows={form.week1Rows}
          weekTotal={week1Total}
          rowHoursFn={rowHours}
          onRowChange={updateWeek1Row}
          weekOcidPrefix="timesheet.week1"
        />

        <div className="mt-4" />

        {/* WEEK 2 TABLE */}
        <WeekTable
          weekLabel="WEEK 2"
          rows={form.week2Rows}
          weekTotal={week2Total}
          rowHoursFn={rowHours}
          onRowChange={updateWeek2Row}
          weekOcidPrefix="timesheet.week2"
        />

        {/* TOTAL PAY PERIOD HOURS */}
        <div className="mt-4 border border-border p-3 flex items-center justify-end gap-4">
          <span className="font-display font-black uppercase tracking-widest text-sm text-foreground">
            Total Pay Period Hours:
          </span>
          <div className="total-hours-box">
            {totalPayPeriodHours.toFixed(2)}
          </div>
        </div>

        {/* SIGNATURE & DATE */}
        <div className="mt-5 grid grid-cols-2 gap-8">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wide mb-1">
              Employee Signature:
            </p>
            <input
              data-ocid="timesheet.signature.input"
              type="text"
              value={form.signatureText}
              onChange={(e) =>
                setForm((f) => ({ ...f, signatureText: e.target.value }))
              }
              placeholder="Sign here"
              className="signature-field"
            />
          </div>
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wide mb-1">
              Date:
            </p>
            <input
              data-ocid="timesheet.date_signed.input"
              type="text"
              value={form.dateSigned}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateSigned: e.target.value }))
              }
              placeholder={formatDateUS(new Date().toISOString().split("T")[0])}
              className="w-full border-b-2 border-foreground bg-transparent outline-none text-sm pb-1 font-mono"
            />
          </div>
        </div>

        {/* DISCLAIMER BOX */}
        <div className="disclaimer-box mt-5">
          <p>
            <strong>Disclaimer:</strong>{" "}
            <em>
              "I took my required meal periods and rest breaks for every shift
              that I worked"
            </em>
          </p>
          <p className="mt-1 font-bold">
            Time sheets are due Monday of the pay week before 12:00pm. NO
            EXCEPTIONS!
          </p>
          <p className="mt-1">
            Submit your time sheet via text message to: 951-227-8834 or via
            email to:{" "}
            <a href="mailto:sheryl@pssca.com" className="underline">
              sheryl@pssca.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── WeekTable Sub-component ──────────────────────────────────────────────────

interface WeekTableProps {
  weekLabel: string;
  rows: WeekRow[];
  weekTotal: number;
  rowHoursFn: (row: WeekRow) => number | null;
  onRowChange: (idx: number, field: keyof WeekRow, value: string) => void;
  weekOcidPrefix: string;
}

function WeekTable({
  weekLabel,
  rows,
  weekTotal,
  rowHoursFn,
  onRowChange,
  weekOcidPrefix,
}: WeekTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="ts-table">
        <tbody>
          {/* Week header row */}
          <tr className="week-header-row">
            <td colSpan={8}>{weekLabel}</td>
          </tr>
          {/* Column header row */}
          <tr>
            <th style={{ width: "15%" }}>Job Location</th>
            <th style={{ width: "5%" }}>Day</th>
            <th style={{ width: "10%" }}>Date</th>
            <th style={{ width: "13%" }}>Work Start Time</th>
            <th style={{ width: "13%" }}>Lunch Out Time</th>
            <th style={{ width: "13%" }}>Lunch In Time</th>
            <th style={{ width: "13%" }}>Work End Time</th>
            <th style={{ width: "11%" }}>Total Hours Worked</th>
          </tr>
          {/* Data rows */}
          {rows.map((row, idx) => {
            const hours = rowHoursFn(row);
            const dayLabel = DAY_LABELS[idx] ?? "";
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows are positionally fixed (7 per week)
              <tr key={idx} data-ocid={`${weekOcidPrefix}.row.${idx + 1}`}>
                <td className="location-cell">
                  <input
                    data-ocid={`${weekOcidPrefix}.location.input.${idx + 1}`}
                    type="text"
                    value={row.jobLocation}
                    onChange={(e) =>
                      onRowChange(idx, "jobLocation", e.target.value)
                    }
                    placeholder="Location"
                    className="ts-location-input"
                  />
                </td>
                <td style={{ fontWeight: 700, fontSize: "0.8rem" }}>
                  {dayLabel}
                </td>
                <td
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDateUS(row.date)}
                </td>
                <td>
                  <input
                    data-ocid={`${weekOcidPrefix}.work_start.input.${idx + 1}`}
                    type="text"
                    value={row.workStart}
                    onChange={(e) =>
                      onRowChange(idx, "workStart", e.target.value)
                    }
                    placeholder="e.g. 7:30 PM"
                    className="ts-time-input"
                  />
                </td>
                <td>
                  <input
                    data-ocid={`${weekOcidPrefix}.lunch_out.input.${idx + 1}`}
                    type="text"
                    value={row.lunchOut}
                    onChange={(e) =>
                      onRowChange(idx, "lunchOut", e.target.value)
                    }
                    placeholder="e.g. 12:00 PM"
                    className="ts-time-input"
                  />
                </td>
                <td>
                  <input
                    data-ocid={`${weekOcidPrefix}.lunch_in.input.${idx + 1}`}
                    type="text"
                    value={row.lunchIn}
                    onChange={(e) =>
                      onRowChange(idx, "lunchIn", e.target.value)
                    }
                    placeholder="e.g. 1:00 PM"
                    className="ts-time-input"
                  />
                </td>
                <td>
                  <input
                    data-ocid={`${weekOcidPrefix}.work_end.input.${idx + 1}`}
                    type="text"
                    value={row.workEnd}
                    onChange={(e) =>
                      onRowChange(idx, "workEnd", e.target.value)
                    }
                    placeholder="e.g. 3:30 AM"
                    className="ts-time-input"
                  />
                </td>
                <td className="hours-cell">
                  {hours !== null ? hours.toFixed(2) : ""}
                </td>
              </tr>
            );
          })}
          {/* Total row */}
          <tr className="total-row">
            <td
              colSpan={7}
              style={{
                textAlign: "right",
                paddingRight: "12px",
                fontFamily: "var(--font-display)",
              }}
            >
              {weekLabel} TOTAL:
            </td>
            <td className="hours-cell">{weekTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
