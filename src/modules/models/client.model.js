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
  },
);

module.exports = conn.model('client', clientSchema);
