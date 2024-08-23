const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  clientId: String,
  name: String,
  storageCapacity: Number,
  usedStorage: Number,
  usedStorage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', ClientSchema);