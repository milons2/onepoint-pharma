const express = require('express');
const router = express.Router();
const { createStaff, login } = require('../services/auth.service');

// Create staff (Owner/Admin/Pharmacist)
router.post('/create', async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    const staff = await createStaff(name, username, password, role);

    res.json({
      success: true,
      staff
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await login(username, password);

    res.json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;