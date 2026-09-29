import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page transition wrapper for consistent animations
 * Wraps page content with fade-in and slide-up animation
 */
const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <div className={`animate-page-enter ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
