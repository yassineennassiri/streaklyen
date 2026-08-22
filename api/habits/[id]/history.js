const prisma = require('../../../lib/prisma');

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

async function handleGet(req, res, habitId) {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { logs: true },
  });

  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  const today = startOfUTCDay(new Date());
  const thirtyDaysAgo = addDays(today, -29);

  const logDates = new Set(habit.logs.map((log) => dateKey(log.date)));

  const last30DaysCount = habit.logs.filter((log) => {
    const logDay = startOfUTCDay(new Date(log.date));
    return logDay >= thirtyDaysAgo && logDay <= today;
  }).length;

  return res.status(200).json({
    id: habit.id,
    name: habit.name,
    createdAt: habit.createdAt,
    streak: computeStreak(logDates, today),
    last30DaysCount,
    logDates: [...logDates].sort(),
  });
}

module.exports = async function handler(req, res) {
  const habitId = Number(req.query.id);

  if (!Number.isInteger(habitId)) {
    return res.status(400).json({ error: 'Invalid habit id' });
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res, habitId);
    }

    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Failed to fetch habit history:', err);
    return res.status(500).json({ error: 'Failed to fetch habit history' });
  }
};
