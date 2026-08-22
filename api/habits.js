const prisma = require('../lib/prisma');

function dateKey(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function startOfUTCDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date, delta) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

function computeStreak(logDates, today) {
  let cursor = today;
  if (!logDates.has(dateKey(cursor))) {
    cursor = addDays(today, -1);
  }

  let streak = 0;
  while (logDates.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

async function handleGet(req, res) {
  try {
    const habits = await prisma.habit.findMany({
      orderBy: { createdAt: 'asc' },
      include: { logs: true },
    });

    const today = startOfUTCDay(new Date());
    const todayKey = dateKey(today);

    const result = habits.map((habit) => {
      const logDates = new Set(habit.logs.map((log) => dateKey(log.date)));

      return {
        id: habit.id,
        name: habit.name,
        createdAt: habit.createdAt,
        completedToday: logDates.has(todayKey),
        streak: computeStreak(logDates, today),
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Failed to fetch habits:', err);
    return res.status(500).json({ error: 'Failed to fetch habits' });
  }
}

async function handlePost(req, res) {
  const { name } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';

  if (!trimmedName) {
    return res.status(400).json({ error: 'Habit name is required' });
  }

  try {
    const habit = await prisma.habit.create({
      data: { name: trimmedName },
    });
    return res.status(201).json(habit);
  } catch (err) {
    console.error('Failed to create habit:', err);
    return res.status(500).json({ error: 'Failed to create habit' });
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
