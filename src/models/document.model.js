const { type } = require('os');
const conn = require('../config/appConn');
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    toBook: { type: String },
    toBook_en: { type: String },
    abstractNote: { type: String },
    abstractNote_en: { type: String },
    số_văn_bản_Đến: { type: String },
    urgencyLevel: { type: String },
    urgencyLevel_en: { type: String },
    số_đến: { type: String },
    số_đến_en: { type: String },
    senderUnit: { type: String },
    senderUnit_en: { type: String },
    sổ_vb: { type: String },
    secondBook: { type: String },
    receiverUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'Receiver' },
    processorUnits: { type: String },
    documentType: { type: String },
    documentType_en: { type: String },
    documentField: { type: String },
    documentField_en: { type: String },
    receiveMethod: { type: String },
    receiveMethod_en: { type: String },
    privateLevel: { type: String },
    privateLevel_en: { type: String },
    nd_xử_lý: { type: String },
    vai_trò: { type: String },
    vai_trò_tiếp_theo: { type: String },
    phân_loại_đơn: { type: String },
    người_đc_ủy_quyền_xử_lý: { type: String },
    sổ_vb_đvi_gửi: { type: String },
  },
  {
    collection: 'Document',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('Document', documentSchema);
