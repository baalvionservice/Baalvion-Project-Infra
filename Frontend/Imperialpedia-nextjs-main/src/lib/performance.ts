/**
 * Performance optimization utilities for mobile devices
 */

// Lazy loading intersection observer
export const createLazyLoadObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void
) => {
  if (typeof window === "undefined") return null;

  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
  });
};

// Debounce function for scroll events
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Check if device is mobile
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
};

// Optimize images for mobile
export const getOptimizedImageSizes = (isMobile: boolean = false): string => {
  if (isMobile) {
    return "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw";
  }
  return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window === "undefined") return;

  // Preload critical fonts
  const fontPreloads = [
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap",
    "https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Cabin:wght@400;700&display=swap",
  ];

  fontPreloads.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = href;
    document.head.appendChild(link);
  });
};

// Reduce motion for better performance
export const shouldReduceMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
