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

function updateProgress(completed, total) {
  const countEl = document.getElementById('progress-count');
  const fillEl = document.getElementById('progress-fill');

  if (countEl) {
    countEl.textContent = `${completed}/${total}`;
  }

  if (fillEl) {
    fillEl.style.width = total > 0 ? `${(completed / total) * 100}%` : '0%';
  }
}

async function loadHabits(listEl, statusEl) {
  try {
    const response = await fetch('/api/habits');
    if (!response.ok) {
      throw new Error('Failed to load habits.');
    }

    const habits = await response.json();

    updateProgress(habits.filter((habit) => habit.completedToday).length, habits.length);

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
      item.className = habit.completedToday ? 'habit-item habit-item-completed' : 'habit-item';

      const nameEl = document.createElement('a');
      nameEl.className = 'habit-name';
      nameEl.href = `habit.html?id=${habit.id}`;
      nameEl.textContent = habit.name;

      const streakEl = document.createElement('span');
      streakEl.className = 'habit-streak';
      streakEl.textContent = `${habit.streak} day streak`;

      const statusButtonEl = document.createElement('button');
      statusButtonEl.type = 'button';
      statusButtonEl.className = 'habit-status';
      statusButtonEl.textContent = habit.completedToday ? 'Done' : 'Mark done';
      statusButtonEl.addEventListener('click', () => {
        toggleHabit(habit.id, habit.completedToday, statusButtonEl, listEl, statusEl);
      });

      const infoEl = document.createElement('div');
      infoEl.className = 'habit-info';
      infoEl.appendChild(nameEl);
      infoEl.appendChild(streakEl);

      item.appendChild(infoEl);
      item.appendChild(statusButtonEl);
      listEl.appendChild(item);
    });
  } catch (err) {
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = err.message || 'Something went wrong loading habits.';
    }
  }
}

async function toggleHabit(habitId, completedToday, buttonEl, listEl, statusEl) {
  buttonEl.disabled = true;

  try {
    const response = await fetch(`/api/habits/${habitId}/log`, {
      method: completedToday ? 'DELETE' : 'POST',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update habit.');
    }

    await loadHabits(listEl, statusEl);
  } catch (err) {
    buttonEl.disabled = false;
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = err.message || 'Something went wrong updating the habit.';
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

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('habit-status');
  const detailEl = document.getElementById('habit-detail');
  if (!detailEl) return;

  const habitId = new URLSearchParams(window.location.search).get('id');
  const deleteButton = document.getElementById('delete-habit-button');

  if (!habitId) {
    statusEl.textContent = 'No habit specified.';
    return;
  }

  loadHabitHistory(habitId, statusEl, detailEl);

  deleteButton.addEventListener('click', () => {
    deleteHabit(habitId, deleteButton, statusEl);
  });
});

async function loadHabitHistory(habitId, statusEl, detailEl) {
  try {
    const response = await fetch(`/api/habits/${habitId}/history`);

    if (response.status === 404) {
      throw new Error('Habit not found.');
    }

    if (!response.ok) {
      throw new Error('Failed to load habit.');
    }

    const habit = await response.json();
    renderHabit(habit, detailEl);

    statusEl.hidden = true;
    detailEl.hidden = false;
  } catch (err) {
    statusEl.textContent = err.message || 'Something went wrong loading the habit.';
  }
}

function renderHabit(habit, detailEl) {
  document.title = `${habit.name} · Streaklyen`;
  document.getElementById('habit-name').textContent = habit.name;
  document.getElementById('habit-streak').textContent = `${habit.streak} day streak`;
  document.getElementById('habit-last30').textContent = `${habit.last30DaysCount} completions in the last 30 days`;

  const createdAt = new Date(habit.createdAt);
  document.getElementById('habit-created').textContent = `Started ${createdAt.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;

  renderCalendar(new Set(habit.logDates));
}

function renderCalendar(logDates) {
  const monthEl = document.getElementById('calendar-month');
  const gridEl = document.getElementById('calendar-grid');

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  monthEl.textContent = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  gridEl.innerHTML = '';

  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leadingBlanks = firstDay.getUTCDay();
  const todayKey = dateKeyLocal(now);

  for (let i = 0; i < leadingBlanks; i += 1) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day calendar-day-empty';
    gridEl.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = String(day);

    if (logDates.has(key)) {
      dayEl.classList.add('calendar-day-completed');
    }

    if (key === todayKey) {
      dayEl.classList.add('calendar-day-today');
    }

    gridEl.appendChild(dayEl);
  }
}

function dateKeyLocal(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

async function deleteHabit(habitId, deleteButton, statusEl) {
  const confirmed = window.confirm('Delete this habit? This cannot be undone.');
  if (!confirmed) return;

  deleteButton.disabled = true;

  try {
    const response = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });

    if (!response.ok && response.status !== 404) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete habit.');
    }

    window.location.href = 'index.html';
  } catch (err) {
    deleteButton.disabled = false;
    statusEl.hidden = false;
    statusEl.textContent = err.message || 'Something went wrong deleting the habit.';
  }
}
