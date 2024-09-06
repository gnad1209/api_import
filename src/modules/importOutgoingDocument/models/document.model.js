const conn = require('../../config/appConn');
const mongoose = require('mongoose');

// Định nghĩa schema cho Books
const outgoingDocumentSchema = new mongoose.Schema(
  {
    senderUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'organizationUnit' }, // đơn vị soạn thảo
    drafter: {
      // người soạn thảo
      type: mongoose.Schema.Types.ObjectId,
      ref: 'employee',
    },
    urgencyLevel: { type: String }, // Độ khẩn
    privateLevel: { type: String }, // Độ mật
    documentType: { type: String }, // Loại văn bản
    documentField: { type: String }, // Lĩnh vực
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'employee' }], //nơi nhận nội bộ
    signer: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }, //người ký
    recipientsOutSystem: { type: String }, // nơi nhận ngoài hệ thống
    receiverUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'organizationUnit' }, // đơn vị nhận
    abstractNote: { type: String, required: true }, // Trích yếu
    incommingDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'IncommingDocument' }, //phúc đáp văn bản
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tasks' }], // Hồ sơ công việc
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'fileManager' }], // file đính kèm ( file manager )

    toBook_en: { type: String },
    abstractNote_en: { type: String },
    urgencyLevel_en: { type: String },
    senderUnit_en: { type: String },
    documentType_en: { type: String },
    documentField_en: { type: String },
    privateLevel_en: { type: String },
  },
  {
    collection: 'outgoingDocument',
    timestamps: true,
  },
);

// Tạo model từ schema
module.exports = conn.model('outgoingDocument', outgoingDocumentSchema);
