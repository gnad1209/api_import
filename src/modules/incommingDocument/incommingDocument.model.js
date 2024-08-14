const { type } = require('os');
const conn = require('../../config/appConn');
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    fullPath: {
      type: String,
      index: true,
    },
    filename: { type: String },
    path: { type: String },
    size: { tye: String },
    mimetype: { tye: String },
    field: { tye: String },
    user: { tye: String },
  },
  {
    collection: 'File',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('File', fileSchema);
