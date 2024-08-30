const conn = require('../config/appConn');
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    name: { type: String },
    number: { type: String },
  },
  {
    collection: 'document',
    timestamps: true,
  },
);

module.exports = conn.model('document', documentSchema);
