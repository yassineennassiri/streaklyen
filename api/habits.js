const prisma = require('../lib/prisma');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
};
