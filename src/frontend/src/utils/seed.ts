import type { backendInterface } from "../backend.d";
import { calcHours } from "./timesheet";

const SEED_KEY = "ps_seeded_v1";

export async function seedIfEmpty(actor: backendInterface): Promise<void> {
  if (localStorage.getItem(SEED_KEY)) return;

  const existing = await actor.getEmployees();
  if (existing.length > 0) {
    localStorage.setItem(SEED_KEY, "1");
    return;
  }

  // Add employees
  const [id1, id2, id3, id4] = await Promise.all([
    actor.addEmployee("John Smith", "Security Guard"),
    actor.addEmployee("Maria Johnson", "Shift Supervisor"),
    actor.addEmployee("David Lee", "Security Guard"),
    actor.addEmployee("Sarah Brown", "Site Manager"),
  ]);

  // Get dates for this week
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));

  function dateStr(offset: number): string {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return d.toISOString().split("T")[0];
  }

  const entries = [
    {
      employeeId: id1,
      date: dateStr(0),
      clockIn: "06:00",
      clockOut: "14:00",
      site: "Main Gate",
      notes: "Morning shift, all clear",
    },
    {
      employeeId: id2,
      date: dateStr(0),
      clockIn: "14:00",
      clockOut: "22:00",
      site: "Main Gate",
      notes: "Afternoon handover complete",
    },
    {
      employeeId: id3,
      date: dateStr(1),
      clockIn: "06:00",
      clockOut: "14:00",
      site: "Warehouse",
      notes: "Patrol completed, no incidents",
    },
    {
      employeeId: id4,
      date: dateStr(1),
      clockIn: "08:00",
      clockOut: "17:00",
      site: "Office Block",
      notes: "Site inspection conducted",
    },
    {
      employeeId: id1,
      date: dateStr(2),
      clockIn: "22:00",
      clockOut: "06:00",
      site: "Warehouse",
      notes: "Night shift, overnight patrol",
    },
    {
      employeeId: id2,
      date: dateStr(2),
      clockIn: "08:00",
      clockOut: "16:00",
      site: "Office Block",
      notes: "Visitor management",
    },
    {
      employeeId: id3,
      date: dateStr(3),
      clockIn: "14:00",
      clockOut: "22:00",
      site: "Main Gate",
      notes: "",
    },
    {
      employeeId: id4,
      date: dateStr(3),
      clockIn: "07:00",
      clockOut: "15:00",
      site: "Warehouse",
      notes: "Delivery oversight",
    },
  ];

  await Promise.all(
    entries.map((e) =>
      actor.addEntry(
        e.employeeId,
        e.date,
        e.clockIn,
        e.clockOut,
        e.site,
        e.notes,
        calcHours(e.clockIn, e.clockOut),
      ),
    ),
  );

  // Approve a couple entries
  const allEntries = await actor.getEntries();
  if (allEntries.length >= 2) {
    await Promise.all([
      actor.updateEntryStatus(allEntries[0].id, "Approved"),
      actor.updateEntryStatus(allEntries[1].id, "Approved"),
    ]);
  }

  localStorage.setItem(SEED_KEY, "1");
}
