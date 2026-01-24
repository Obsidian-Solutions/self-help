// Dark Mode Toggler
// Checks local storage or system preference on load and sets it immediately
// This runs inline to prevent FOUC (Flash of Unstyled Content)
(function() {
  const html = document.documentElement;
  const isDark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    html.classList.add('dark');
    localStorage.theme = 'dark';
  } else {
    html.classList.remove('dark');
    localStorage.theme = 'light';
  }
})();

window.toggleDarkMode = function() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  
  if (isDark) {
    html.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    html.classList.add('dark');
    localStorage.theme = 'dark';
  }
  
  // Trigger any DOM updates that depend on dark mode
  document.dispatchEvent(new CustomEvent('darkModeToggled', { detail: { isDark: !isDark } }));
}
