const conn = require('../../config/appConn');
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    file_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    collection: 'File',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('File', fileSchema);
