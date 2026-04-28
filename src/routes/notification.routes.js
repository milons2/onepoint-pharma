const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/* =====================================
   GET ALL NOTIFICATIONS FOR STAFF
===================================== */
router.get('/:staffId', async (req, res) => {
  try {
    const staffId = Number(req.params.staffId);

    const notifications = await prisma.notification.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/* =====================================
   MARK NOTIFICATION AS READ
===================================== */
router.put('/read/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;
