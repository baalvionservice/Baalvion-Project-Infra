import React from "react";

export function cloneIconWithProps(
  icon: React.ReactElement,
  props: { size?: number; className?: string }
): React.ReactElement {
  return React.cloneElement(icon, props as any);
}
