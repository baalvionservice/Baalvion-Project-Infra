/**
 * Inlined into <head> before hydration so the correct theme class is applied
 * on first paint — avoids a light/dark flash on load.
 */
export const THEME_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem('help-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {}
})();`;
