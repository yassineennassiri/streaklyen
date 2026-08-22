document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-habit-form');
  if (!form) return;

  const nameInput = document.getElementById('habit-name');
  const errorEl = document.getElementById('form-error');
  const cancelButton = document.getElementById('cancel-button');
  const submitButton = form.querySelector('button[type="submit"]');

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    if (!name) {
      showError('Please enter a habit name.');
      return;
    }

    hideError();
    submitButton.disabled = true;

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add habit.');
      }

      window.location.href = 'index.html';
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
      submitButton.disabled = false;
    }
  });
});
