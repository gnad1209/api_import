const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  name: { type: String, default: '' }, 
  filename: { type: String, default: '' }, 
  path: { type: String, default: '' }, 
  size: { type: Number, default: 0 }, 
  mimetype: { type: String, default: '' }, 
  field: { type: String, default: '' }, 
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
