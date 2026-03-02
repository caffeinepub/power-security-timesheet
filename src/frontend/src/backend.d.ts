import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Employee {
    id: bigint;
    active: boolean;
    name: string;
    role: string;
}
export interface TimesheetEntry {
    id: bigint;
    status: string;
    date: string;
    hoursWorked: number;
    site: string;
    clockOut: string;
    clockIn: string;
    employeeId: bigint;
    notes: string;
}
export interface backendInterface {
    addEmployee(name: string, role: string): Promise<bigint>;
    addEntry(employeeId: bigint, date: string, clockIn: string, clockOut: string, site: string, notes: string, hoursWorked: number): Promise<bigint>;
    deleteEntry(id: bigint): Promise<void>;
    getActiveEmployees(): Promise<Array<Employee>>;
    getEmployees(): Promise<Array<Employee>>;
    getEntries(): Promise<Array<TimesheetEntry>>;
    getEntriesByEmployee(employeeId: bigint): Promise<Array<TimesheetEntry>>;
    removeEmployee(id: bigint): Promise<void>;
    updateEmployee(id: bigint, name: string, role: string, active: boolean): Promise<void>;
    updateEntry(id: bigint, employeeId: bigint, date: string, clockIn: string, clockOut: string, site: string, notes: string, hoursWorked: number, status: string): Promise<void>;
    updateEntryStatus(id: bigint, status: string): Promise<void>;
}
