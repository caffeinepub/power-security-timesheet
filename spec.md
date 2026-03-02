# Power Security Timesheet

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Employee timesheet tracking application for a security company
- Employees (guards/staff) with name and role
- Timesheet entries: employee, date, clock-in time, clock-out time, site/location, notes
- Calculated hours per entry (auto-computed from clock-in/out)
- Weekly/daily summary view showing total hours per employee
- Admin ability to add, edit, and delete timesheet entries
- Admin ability to manage employees (add, edit, remove)
- Export/summary of total hours per pay period
- Status tracking: pending, approved, rejected per entry

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend (Motoko):
   - Employee record: id, name, role, active
   - TimesheetEntry record: id, employeeId, date, clockIn, clockOut, site, notes, status (Pending/Approved/Rejected), hoursWorked
   - CRUD for employees: addEmployee, updateEmployee, removeEmployee, getEmployees
   - CRUD for timesheet entries: addEntry, updateEntry, deleteEntry, getEntries, getEntriesByEmployee, getEntriesByDateRange
   - Approve/reject entry: updateEntryStatus

2. Frontend:
   - Navigation: Dashboard, Timesheets, Employees
   - Dashboard: summary cards (total hours this week, pending approvals, active employees), recent entries table
   - Timesheets page: filterable table of all entries, add/edit/delete entry modal, approve/reject actions
   - Employees page: list of employees, add/edit/remove employee modal
   - Entry form: employee select, date, clock-in, clock-out, site, notes
   - Hours auto-calculated from clock-in/clock-out
