import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

let hasUnsavedChanges = false;
let unsavedChangeHandlers: (() => void)[] = [];

export function setHasUnsavedChanges(state: boolean) {
  hasUnsavedChanges = state;
}

export function getHasUnsavedChanges() {
  return hasUnsavedChanges;
}

export function registerUnsavedChangeListener(callback: () => void) {
  unsavedChangeHandlers.push(callback);
  return () => {
    unsavedChangeHandlers = unsavedChangeHandlers.filter(h => h !== callback);
  };
}

export function notifyUnsavedChanges() {
  unsavedChangeHandlers.forEach(h => h());
}

export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, []);
}
