const conn = require('../config/appConn');
const mongoose = require('mongoose');

const organizationUnitSchema = new mongoose.Schema(
  {
    name: { type: String },
    type: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'organizationUnit',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('organizationUnit', organizationUnitSchema);
