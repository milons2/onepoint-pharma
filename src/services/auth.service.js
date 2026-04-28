const { PrismaClient } = require('@prisma/client');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createStaff(name, username, password, role) {
  const hash = await bcrypt.hash(password, 10);

  return prisma.staff.create({
    data: {
      name,
      username,
      password: hash,
      role
    }
  });
}

async function login(username, password) {
  const user = await prisma.staff.findUnique({
    where: { username }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new Error('Invalid password');
  }

  // ✅ CREATE JWT TOKEN
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    }
  };
}

module.exports = { createStaff, login };