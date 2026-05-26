import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  section?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  section = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8",
        section && "py-16 md:py-24",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
