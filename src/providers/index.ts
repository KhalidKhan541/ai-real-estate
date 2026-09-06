"use client";

import React from "react";
import { ThemeProvider, useTheme } from "./theme-provider";
import { ToastProvider, useToast } from "./toast-provider";
import { QueryProvider } from "./query-provider";

interface AppProviderProps {
  children: React.ReactNode;
  theme?: "light" | "dark" | "system";
}

export function AppProvider({ children, theme = "system" }: AppProviderProps) {
  return (
    <ThemeProvider defaultTheme={theme}>
      <ToastProvider>
        <QueryProvider>{children}</QueryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export function useAppContext() {
  const theme = useTheme();
  const toast = useToast();

  return {
    ...theme,
    toast,
  };
}

export { ThemeProvider, useTheme } from "./theme-provider";
export { ToastProvider, useToast } from "./toast-provider";
export { QueryProvider } from "./query-provider";

export default AppProvider;
