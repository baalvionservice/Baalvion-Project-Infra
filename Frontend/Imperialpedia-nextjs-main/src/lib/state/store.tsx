"use client";

import React, { ReactNode } from 'react';
import { AppProvider } from './app-store';
import { UIProvider } from './ui-store';
import { CalculatorProvider } from './calculator-store';

export function GlobalStoreProvider({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <UIProvider>
        <CalculatorProvider>
          {children}
        </CalculatorProvider>
      </UIProvider>
    </AppProvider>
  );
}
