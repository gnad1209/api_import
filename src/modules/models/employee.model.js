const conn = require('../config/appConn');
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    username: { type: String },
    departmentName: { type: String },
  },
  {
    collection: 'employee',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('employee', employeeSchema);
