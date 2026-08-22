document.addEventListener('DOMContentLoaded', () => {
  const dateEl = document.getElementById('today-date');
  const listEl = document.getElementById('habits-list');
  const statusEl = document.getElementById('habits-status');

  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (listEl) {
    loadHabits(listEl, statusEl);
  }
});

async function loadHabits(listEl, statusEl) {
  try {
    const response = await fetch('/api/habits');
    if (!response.ok) {
      throw new Error('Failed to load habits.');
    }

    const habits = await response.json();

    listEl.innerHTML = '';

    if (habits.length === 0) {
      if (statusEl) {
        statusEl.textContent = 'No habits yet. Add one to get started.';
      }
      return;
    }

    if (statusEl) {
      statusEl.hidden = true;
    }

    habits.forEach((habit) => {
      const item = document.createElement('li');

      const nameEl = document.createElement('span');
      nameEl.className = 'habit-name';
      nameEl.textContent = habit.name;

      const streakEl = document.createElement('span');
      streakEl.className = 'habit-streak';
      streakEl.textContent = `${habit.streak} day streak`;

      const statusLabelEl = document.createElement('span');
      statusLabelEl.className = 'habit-status';
      statusLabelEl.textContent = habit.completedToday ? 'Done' : 'Mark done';

      item.appendChild(nameEl);
      item.appendChild(streakEl);
      item.appendChild(statusLabelEl);
      listEl.appendChild(item);
    });
  } catch (err) {
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = err.message || 'Something went wrong loading habits.';
    }
  }
}

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
