import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Employee, TimesheetEntry } from "../backend.d";
import { useActor } from "./useActor";

// ─── Query Hooks ────────────────────────────────────────────────────────────

export function useEmployees() {
  const { actor, isFetching } = useActor();
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEmployees();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveEmployees() {
  const { actor, isFetching } = useActor();
  return useQuery<Employee[]>({
    queryKey: ["activeEmployees"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveEmployees();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<TimesheetEntry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutation Hooks ─────────────────────────────────────────────────────────

export function useAddEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, role }: { name: string; role: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addEmployee(name, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
    },
  });
}

export function useUpdateEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      role,
      active,
    }: {
      id: bigint;
      name: string;
      role: string;
      active: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateEmployee(id, name, role, active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
    },
  });
}

export function useRemoveEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.removeEmployee(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["activeEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useAddEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      date,
      clockIn,
      clockOut,
      site,
      notes,
      hoursWorked,
    }: {
      employeeId: bigint;
      date: string;
      clockIn: string;
      clockOut: string;
      site: string;
      notes: string;
      hoursWorked: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addEntry(
        employeeId,
        date,
        clockIn,
        clockOut,
        site,
        notes,
        hoursWorked,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useUpdateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      employeeId,
      date,
      clockIn,
      clockOut,
      site,
      notes,
      hoursWorked,
      status,
    }: {
      id: bigint;
      employeeId: bigint;
      date: string;
      clockIn: string;
      clockOut: string;
      site: string;
      notes: string;
      hoursWorked: number;
      status: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateEntry(
        id,
        employeeId,
        date,
        clockIn,
        clockOut,
        site,
        notes,
        hoursWorked,
        status,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useUpdateEntryStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateEntryStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}
