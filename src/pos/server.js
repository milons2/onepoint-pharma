const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

// ================== LOAD ENV SAFELY ==================
const isPackaged = process.env.NODE_ENV === 'production';

require('dotenv').config({
  path: isPackaged
    ? path.join(process.resourcesPath, '.env')
    : path.join(__dirname, '../../.env')
});

// ================== INIT ==================
const app = express();
const server = http.createServer(app);

// ================== ROUTES ==================
const authRoutes = require('../routes/auth.routes');
const dashboardRoutes = require('../routes/dashboard.routes');
const adminDashboardRoutes = require('../routes/dashboard.admin.routes');
const staffRoutes = require('../routes/staff.routes');
const categoryRoutes = require('../routes/category.routes');
const supplierRoutes = require('../routes/supplier.routes');
const reportRoutes = require('../routes/report.routes');
const alertRoutes = require("../routes/alert.routes");
const notificationRoutes = require('../routes/notification.routes');

const medicineRoutes = require('../routes/medicine.routes');
const batchRoutes = require('../routes/batch.routes');
const posRoutes = require("../routes/pos.routes");

const billingRoutes = require('../routes/billing.routes');
const refundRoutes = require("../routes/refund.routes");
const pharmacistReportRoutes = require("../routes/pharmacistReport.routes");

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());

// Debug logger
app.use((req, res, next) => {
  console.log('REQ:', req.method, req.url);
  next();
});

// ================== ROOT ==================
app.get('/', (req, res) => {
  res.send('OnePoint Pharma POS backend is running!');
});

// ================== API ROUTES ==================
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard', adminDashboardRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/alerts", alertRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/medicines', medicineRoutes);
app.use('/api/batches', batchRoutes);
app.use("/api/pos", posRoutes);

app.use('/api/billing', billingRoutes);
app.use("/api/refund", refundRoutes);
app.use("/api/pharmacist", pharmacistReportRoutes);

// ================== SOCKET ==================
const { initSocket } = require('../socket/socket.manager');
const io = initSocket(server);
app.set("socketio", io);

// ================== START SERVER ==================
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});