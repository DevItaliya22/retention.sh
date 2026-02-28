"use client";

import * as React from "react";

const DataTableToolbarActionsContext =
  React.createContext<React.ReactNode>(null);

interface DataTableToolbarActionsProviderProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DataTableToolbarActionsProvider({
  children,
  actions,
}: DataTableToolbarActionsProviderProps) {
  return (
    <DataTableToolbarActionsContext.Provider value={actions ?? null}>
      {children}
    </DataTableToolbarActionsContext.Provider>
  );
}

export function useDataTableToolbarActions() {
  return React.useContext(DataTableToolbarActionsContext);
}
