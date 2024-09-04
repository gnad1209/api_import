const mongoose = require('mongoose');

// Định nghĩa schema cho Books
const bookSchema = new mongoose.Schema({
  toBook: { type: Number, required: true }, // Số, ký hiệu văn bản
  abstractNote: { type: String, required: true }, // Trích yếu
  urgencyLevel: { type: String, default: 'thng' }, // Độ khẩn
  senderUnit: { type: String, required: true }, // Đơn vị soạn thảo
  documentType: { type: String, default: 'Congvan' }, // Loại văn bản
  releaseDate: { type: String }, // Ngày ban hành
  releaseNo: { type: String }, // Số văn bản đi
  documentField: { type: String, default: 'vn-bn-quy-phm-php-lut' }, // Lĩnh vực
  privateLevel: { type: String, default: 'mt' }, // Độ mật
  currentNote: { type: String }, // Nội dung xử lý
  importIncommingDocument: { type: String }, // Phúc đáp văn bản
  tasks: { type: String }, // Công việc liên quan
  autoReleaseCheck: { type: Boolean, default: false }, // Tự động ban hành
  caSignCheck: { type: Boolean, default: false }, // Ký CA
  currentRole: { type: String }, // Vai trò
  nextRole: { type: String }, // Vai trò tiếp theo
  attachment_file1: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  attachment_file2: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  attachment_file3: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
});

// Tạo model từ schema
module.exports = mongoose.model('Book', bookSchema);
