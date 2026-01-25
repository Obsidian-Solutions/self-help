// Dark Mode Configuration
(function () {
  const theme = localStorage.getItem('theme-preference') || 'auto';
  applyTheme(theme);
})();

function applyTheme(theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

window.toggleDarkMode = function () {
  const currentTheme = localStorage.getItem('theme-preference') || 'auto';
  let nextTheme;

  if (document.documentElement.classList.contains('dark')) {
    nextTheme = 'light';
  } else {
    nextTheme = 'dark';
  }

  localStorage.setItem('theme-preference', nextTheme);
  applyTheme(nextTheme);
};

window.setTheme = function (theme) {
  localStorage.setItem('theme-preference', theme);
  applyTheme(theme);
};

// Listen for system changes if set to auto
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (localStorage.getItem('theme-preference') === 'auto') {
    applyTheme('auto');
  }
});
