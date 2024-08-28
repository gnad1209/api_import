const { type } = require('os');
const conn = require('../config/appConn');
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    clientId: { type: String },
    storageCapacity: { type: Number },
    usedStorage: { type: Number },
  },
  {
    collection: 'client',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('client', clientSchema);
