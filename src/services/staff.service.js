const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/* GET ALL STAFF */
async function getAllStaff() {
  return prisma.staff.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true
    }
  });
}

/* UPDATE STAFF (ROLE / PASSWORD) */
async function updateStaff(id, data) {
  const updateData = {};

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (data.role) {
    updateData.role = data.role;
  }

  return prisma.staff.update({
    where: { id },
    data: updateData
  });
}

/* DELETE STAFF */
async function deleteStaff(id) {
  return prisma.staff.delete({
    where: { id }
  });
}

module.exports = {
  getAllStaff,
  updateStaff,
  deleteStaff
};