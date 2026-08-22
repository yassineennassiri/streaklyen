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

async function buildHabitResponse(habit, today) {
  const logs = await prisma.habitLog.findMany({ where: { habitId: habit.id } });
  const logDates = new Set(logs.map((log) => dateKey(log.date)));

  return {
    id: habit.id,
    name: habit.name,
    createdAt: habit.createdAt,
    completedToday: logDates.has(dateKey(today)),
    streak: computeStreak(logDates, today),
  };
}

async function handlePost(req, res, habitId) {
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  const today = startOfUTCDay(new Date());

  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date: today } },
    create: { habitId, date: today },
    update: {},
  });

  const result = await buildHabitResponse(habit, today);
  return res.status(200).json(result);
}

async function handleDelete(req, res, habitId) {
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  const today = startOfUTCDay(new Date());

  await prisma.habitLog.deleteMany({
    where: { habitId, date: today },
  });

  const result = await buildHabitResponse(habit, today);
  return res.status(200).json(result);
}

module.exports = async function handler(req, res) {
  const habitId = Number(req.query.id);

  if (!Number.isInteger(habitId)) {
    return res.status(400).json({ error: 'Invalid habit id' });
  }

  try {
    if (req.method === 'POST') {
      return await handlePost(req, res, habitId);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(req, res, habitId);
    }

    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Failed to update habit log:', err);
    return res.status(500).json({ error: 'Failed to update habit log' });
  }
};
