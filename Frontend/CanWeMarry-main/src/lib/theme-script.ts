/**
 * Applies the stored theme before first paint, so a reader never gets a flash of the wrong
 * one. Runs inline in <head>; it must stay dependency-free and synchronous.
 */
export const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('cwm-theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`.trim();
