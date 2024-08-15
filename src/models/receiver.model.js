const { type } = require('os');
const conn = require('../config/appConn');
const mongoose = require('mongoose');

const receiverSchema = new mongoose.Schema(
  {
    name: { type: String },
  },
  {
    collection: 'Receiver',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('Receiver', receiverSchema);
