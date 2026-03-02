import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Loader2, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Employee } from "../backend.d";
import {
  useAddEmployee,
  useEmployees,
  useRemoveEmployee,
  useUpdateEmployee,
} from "../hooks/useQueries";

interface EmployeeFormData {
  name: string;
  role: string;
}

const defaultForm: EmployeeFormData = { name: "", role: "" };

export default function EmployeesPage() {
  const { data: employees = [], isLoading } = useEmployees();
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const removeEmployee = useRemoveEmployee();

  // Employee form modal
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormData>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<EmployeeFormData>>({});

  // Delete confirm modal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEmp, setDeletingEmp] = useState<Employee | null>(null);

  function openAddModal() {
    setEditingEmp(null);
    setForm(defaultForm);
    setFormErrors({});
    setEmpModalOpen(true);
  }

  function openEditModal(emp: Employee) {
    setEditingEmp(emp);
    setForm({ name: emp.name, role: emp.role });
    setFormErrors({});
    setEmpModalOpen(true);
  }

  function validateForm(): boolean {
    const errors: Partial<EmployeeFormData> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.role.trim()) errors.role = "Role is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmitEmployee() {
    if (!validateForm()) return;
    try {
      if (editingEmp) {
        await updateEmployee.mutateAsync({
          id: editingEmp.id,
          name: form.name.trim(),
          role: form.role.trim(),
          active: editingEmp.active,
        });
        toast.success("Employee updated");
      } else {
        await addEmployee.mutateAsync({
          name: form.name.trim(),
          role: form.role.trim(),
        });
        toast.success("Employee added");
      }
      setEmpModalOpen(false);
    } catch {
      toast.error("Failed to save employee");
    }
  }

  async function handleToggleActive(emp: Employee) {
    try {
      await updateEmployee.mutateAsync({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        active: !emp.active,
      });
      toast.success(
        emp.active ? "Employee deactivated" : "Employee reactivated",
      );
    } catch {
      toast.error("Failed to update employee status");
    }
  }

  async function handleRemove() {
    if (!deletingEmp) return;
    try {
      await removeEmployee.mutateAsync(deletingEmp.id);
      toast.success("Employee removed");
      setDeleteDialogOpen(false);
      setDeletingEmp(null);
    } catch {
      toast.error("Failed to remove employee");
    }
  }

  const isPending = addEmployee.isPending || updateEmployee.isPending;
  const sorted = [...employees].sort((a, b) => {
    if (a.active === b.active) return a.name.localeCompare(b.name);
    return a.active ? -1 : 1;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Employees
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your security team roster
          </p>
        </div>
        <Button
          data-ocid="employees.add_employee.button"
          onClick={openAddModal}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-glow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Table */}
      <Card data-ocid="employees.table" className="border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-16"
              data-ocid="employees.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : sorted.length === 0 ? (
            <div
              className="text-center py-16 text-muted-foreground text-sm"
              data-ocid="employees.empty_state"
            >
              No employees found. Add your first team member.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Role
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
                  {sorted.map((emp, idx) => {
                    const displayIdx = idx + 1;
                    return (
                      <motion.tr
                        key={emp.id.toString()}
                        data-ocid={`employees.item.${displayIdx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="border-t border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {emp.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">
                              {emp.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {emp.role}
                        </td>
                        <td className="px-4 py-3">
                          {emp.active ? (
                            <span className="status-badge-approved text-xs px-2 py-0.5 rounded-full font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="status-badge-rejected text-xs px-2 py-0.5 rounded-full font-medium">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              data-ocid={`employees.toggle.button.${displayIdx}`}
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${emp.active ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}`}
                              title={emp.active ? "Deactivate" : "Reactivate"}
                              onClick={() => handleToggleActive(emp)}
                              disabled={updateEmployee.isPending}
                            >
                              {emp.active ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              data-ocid={`employees.edit.button.${displayIdx}`}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              title="Edit"
                              onClick={() => openEditModal(emp)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              data-ocid={`employees.remove.button.${displayIdx}`}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Remove"
                              onClick={() => {
                                setDeletingEmp(emp);
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

      {/* Employee Form Modal */}
      <Dialog open={empModalOpen} onOpenChange={setEmpModalOpen}>
        <DialogContent
          data-ocid="employee_form.dialog"
          className="sm:max-w-[420px] bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {editingEmp ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Full Name *
              </Label>
              <Input
                data-ocid="employee_form.name.input"
                placeholder="e.g. John Smith"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className={`bg-muted/30 border-border ${formErrors.name ? "border-destructive" : ""}`}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Role *</Label>
              <Input
                data-ocid="employee_form.role.input"
                placeholder="e.g. Security Guard, Shift Supervisor…"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
                className={`bg-muted/30 border-border ${formErrors.role ? "border-destructive" : ""}`}
              />
              {formErrors.role && (
                <p className="text-xs text-destructive">{formErrors.role}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              data-ocid="employee_form.cancel_button"
              variant="outline"
              onClick={() => setEmpModalOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              data-ocid="employee_form.submit_button"
              onClick={handleSubmitEmployee}
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : editingEmp ? (
                "Update Employee"
              ) : (
                "Add Employee"
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
              Remove Employee
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {deletingEmp?.name}
            </span>
            ? This will also remove all their timesheet entries.
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
              onClick={handleRemove}
              disabled={removeEmployee.isPending}
            >
              {removeEmployee.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
