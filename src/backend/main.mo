import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";

actor {
  type Employee = {
    id : Nat;
    name : Text;
    role : Text;
    active : Bool;
  };

  type TimesheetEntry = {
    id : Nat;
    employeeId : Nat;
    date : Text;
    clockIn : Text;
    clockOut : Text;
    site : Text;
    notes : Text;
    status : Text; // "Pending", "Approved", "Rejected"
    hoursWorked : Float;
  };

  module Employee {
    public func compare(e1 : Employee, e2 : Employee) : Order.Order {
      Nat.compare(e1.id, e2.id);
    };
  };

  module TimesheetEntry {
    public func compare(e1 : TimesheetEntry, e2 : TimesheetEntry) : Order.Order {
      Nat.compare(e1.id, e2.id);
    };
  };

  let employees = Map.empty<Nat, Employee>();
  let timesheetEntries = Map.empty<Nat, TimesheetEntry>();
  var nextEmployeeId = 1;
  var nextEntryId = 1;

  // Employee Management
  public shared ({ caller }) func addEmployee(name : Text, role : Text) : async Nat {
    let id = nextEmployeeId;
    let employee : Employee = {
      id;
      name;
      role;
      active = true;
    };
    employees.add(id, employee);
    nextEmployeeId += 1;
    id;
  };

  public shared ({ caller }) func updateEmployee(id : Nat, name : Text, role : Text, active : Bool) : async () {
    let employee : Employee = {
      id;
      name;
      role;
      active;
    };
    employees.add(id, employee);
  };

  public shared ({ caller }) func removeEmployee(id : Nat) : async () {
    employees.remove(id);
  };

  public query ({ caller }) func getEmployees() : async [Employee] {
    employees.values().toArray().sort();
  };

  public query ({ caller }) func getActiveEmployees() : async [Employee] {
    employees.values().toArray().filter(func(emp) { emp.active });
  };

  // Timesheet Management
  public shared ({ caller }) func addEntry(employeeId : Nat, date : Text, clockIn : Text, clockOut : Text, site : Text, notes : Text, hoursWorked : Float) : async Nat {
    let id = nextEntryId;
    let entry : TimesheetEntry = {
      id;
      employeeId;
      date;
      clockIn;
      clockOut;
      site;
      notes;
      status = "Pending";
      hoursWorked;
    };
    timesheetEntries.add(id, entry);
    nextEntryId += 1;
    id;
  };

  public shared ({ caller }) func updateEntry(id : Nat, employeeId : Nat, date : Text, clockIn : Text, clockOut : Text, site : Text, notes : Text, hoursWorked : Float, status : Text) : async () {
    let entry : TimesheetEntry = {
      id;
      employeeId;
      date;
      clockIn;
      clockOut;
      site;
      notes;
      status;
      hoursWorked;
    };
    timesheetEntries.add(id, entry);
  };

  public shared ({ caller }) func deleteEntry(id : Nat) : async () {
    timesheetEntries.remove(id);
  };

  public query ({ caller }) func getEntries() : async [TimesheetEntry] {
    timesheetEntries.values().toArray().sort();
  };

  public query ({ caller }) func getEntriesByEmployee(employeeId : Nat) : async [TimesheetEntry] {
    timesheetEntries.values().toArray().filter(func(entry) { entry.employeeId == employeeId });
  };

  public shared ({ caller }) func updateEntryStatus(id : Nat, status : Text) : async () {
    switch (timesheetEntries.get(id)) {
      case (?entry) {
        let updatedEntry : TimesheetEntry = {
          entry with status;
        };
        timesheetEntries.add(id, updatedEntry);
      };
      case (null) { Runtime.trap("Entry not found") };
    };
  };
};
