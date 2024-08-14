const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  name: String,
  filename: String,
  path: String,
  size: Number,
  mimetype: String,
  field: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);