// Dark Mode Toggler
// Checks local storage or system preference on load and sets it immediately
// This runs inline to prevent FOUC (Flash of Unstyled Content)
(function () {
  const html = document.documentElement;
  const isDark =
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    html.classList.add('dark');
    localStorage.theme = 'dark';
  } else {
    html.classList.remove('dark');
    localStorage.theme = 'light';
  }
})();

window.toggleDarkMode = function () {
  const currentTheme = localStorage.getItem('theme-preference') || 'auto';
  let newTheme;

  if (currentTheme === 'auto') {
    newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  } else {
    newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  }

  if (window.setTheme) {
    window.setTheme(newTheme);
  } else {
    // Basic fallback
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
};
