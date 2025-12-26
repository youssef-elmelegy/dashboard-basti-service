import { useDeleteDialogStore } from "@/stores/deleteDialogStore";

export function useDeleteDialog() {
  // Directly use zustand store for dialog actions
  const { openDeleteDialog } = useDeleteDialogStore();
  return { openDeleteDialog };
}
