async function loadSnackbarPartial() {
  try {
    const resp = await fetch('partials/snackbar.html');
    const html = await resp.text();
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    window.showSnackbar = function(message, type = 'info', duration = 3500) {
      const snackbar = document.getElementById('snackbar');
      const msg = document.getElementById('snackbar-message');
      if (!snackbar || !msg) return;
      msg.textContent = message;
      snackbar.classList.remove('snackbar-success', 'snackbar-error', 'snackbar-info');
      snackbar.classList.add(`snackbar-${type}`);
      snackbar.classList.add('snackbar-show');
      clearTimeout(window._snackbarTimer);
      window._snackbarTimer = setTimeout(() => {
        snackbar.classList.remove('snackbar-show');
      }, duration);
    }
  } catch (err) {
    console.error('Failed to load snackbar partial', err);
  }
}

document.addEventListener('DOMContentLoaded', loadSnackbarPartial);
