const conn = require('../config/appConn');
const mongoose = require('mongoose');

const signerSchema = new mongoose.Schema(
  {
    title: { type: String },
    value: { type: String },
  },
  {
    collection: 'signer',
    timestamps: true,
  },
);

module.exports = conn.model('signer', signerSchema);
