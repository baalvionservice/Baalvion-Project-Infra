import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to safely clone React elements with additional props
export function cloneElementWithProps(
  element: React.ReactElement,
  props: Record<string, any>
) {
  return React.cloneElement(element, props);
}
