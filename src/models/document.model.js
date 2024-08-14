const { type } = require('os');
const conn = require('../config/appConn');
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    profileId: { type: String },
  },
  {
    collection: 'Document',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('Document', documentSchema);
