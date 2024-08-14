const { type } = require('os');
const conn = require('../../config/appConn');
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
    },
    filename: { type: String },
    path: { type: String },
    size: { type: Number },
    mimetype: { type: String },
    field: { type: String },
    user: { type: String },
  },
  {
    collection: 'File',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('File', fileSchema);
