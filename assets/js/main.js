// MindFull UI Utilities

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or 'info' (default)
 * @param {number} duration - Time in ms before toast disappears (default 5000)
 */
window.showToast = function(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  const template = document.getElementById('toast-template');
  
  if (!container || !template) {
    console.error('Toast container or template not found');
    return;
  }

  const toast = template.content.cloneNode(true).querySelector('.toast-item');
  const messageEl = toast.querySelector('#toast-message');
  const iconContainer = toast.querySelector('#toast-icon-container');
  
  messageEl.textContent = message;
  
  // Configure based on type
  let iconSvg = '';
  switch(type) {
  case 'success':
    iconContainer.classList.add('text-green-500', 'bg-green-100', 'dark:bg-green-800', 'dark:text-green-200');
    iconSvg = '<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/></svg>';
    break;
  case 'error':
    iconContainer.classList.add('text-red-500', 'bg-red-100', 'dark:bg-red-800', 'dark:text-red-200');
    iconSvg = '<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/></svg>';
    break;
  default: // info
    iconContainer.classList.add('text-blue-500', 'bg-blue-100', 'dark:bg-blue-800', 'dark:text-blue-200');
    iconSvg = '<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9 5h2v2H9V5Zm0 4h2v7H9V9Z"/></svg>';
  }
  
  iconContainer.innerHTML = iconSvg;
  container.appendChild(toast);
  
  // Auto-remove
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => toast.remove(), 500);
    }, duration);
  }
};
