const prisma = require('../../lib/prisma');

async function handleDelete(req, res, habitId) {
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  await prisma.habit.delete({ where: { id: habitId } });

  return res.status(204).end();
}

module.exports = async function handler(req, res) {
  const habitId = Number(req.query.id);

  if (!Number.isInteger(habitId)) {
    return res.status(400).json({ error: 'Invalid habit id' });
  }

  try {
    if (req.method === 'DELETE') {
      return await handleDelete(req, res, habitId);
    }

    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Failed to delete habit:', err);
    return res.status(500).json({ error: 'Failed to delete habit' });
  }
};
